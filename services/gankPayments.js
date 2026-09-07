const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const ORDER_CODE_PATTERN = /\bOML-[A-Z0-9]{6}\b/i;
const DEFAULT_ORDER_TTL_MS = 60 * 60 * 1_000;
const COMPLETED_ORDER_RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

function parseBahtToSatang(raw) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const satang = Math.round(amount * 100);
    if (!Number.isSafeInteger(satang) || Math.abs((amount * 100) - satang) > 1e-6) return null;
    return satang;
}

function extractOrderCode(message) {
    if (typeof message !== 'string') return null;
    return message.match(ORDER_CODE_PATTERN)?.[0].toUpperCase() ?? null;
}

function hasTestMarker(payload, data, queue) {
    return Boolean(
        payload?.isTest
        || payload?.is_test
        || data?.isTest
        || data?.is_test
        || queue?.isTest
        || queue?.is_test
        || data?.donationSetting?.stream_alert_variation_test
    );
}

function parseGankAlert(rawPayload) {
    let payload;
    try {
        payload = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
    } catch {
        return { ok: false, reason: 'invalid_json' };
    }

    if (!payload || payload.eventType !== 'ALERT_AND_TTS') {
        return { ok: false, reason: 'unrelated_event' };
    }

    const data = payload.data;
    const queue = data?.mediaQueue;
    if (!queue || typeof queue !== 'object') {
        return { ok: false, reason: 'missing_media_queue' };
    }

    if (hasTestMarker(payload, data, queue)) {
        return { ok: false, reason: 'test_alert' };
    }

    const eventId = typeof queue.id === 'string' ? queue.id.trim() : String(queue.id ?? '').trim();
    if (!eventId) return { ok: false, reason: 'missing_event_id' };

    const code = extractOrderCode(queue.donorMessage);
    if (!code) return { ok: false, reason: 'missing_order_code', eventId };

    const currency = String(queue.donationLocalCurrency ?? '').trim().toUpperCase();
    if (currency !== 'THB') {
        return { ok: false, reason: 'unsupported_currency', eventId, code, currency: currency || 'UNKNOWN' };
    }

    const amountSatang = parseBahtToSatang(queue.donationAmountLocalCurrency);
    if (amountSatang === null) {
        return { ok: false, reason: 'invalid_amount', eventId, code };
    }

    return {
        ok: true,
        eventId,
        code,
        amountSatang,
        currency,
        donorName: typeof queue.donorName === 'string' ? queue.donorName.slice(0, 100) : null,
    };
}

function createOrderManager({
    storagePath = path.join(__dirname, '..', 'data', 'gank-orders.json'),
    orderTtlMs = DEFAULT_ORDER_TTL_MS,
    randomBytes = crypto.randomBytes,
} = {}) {
    let loaded = false;
    let state = { orders: [], processedEventIds: [] };
    let operationQueue = Promise.resolve();

    function withLock(operation) {
        const result = operationQueue.then(operation, operation);
        operationQueue = result.catch(() => {});
        return result;
    }

    async function load() {
        if (loaded) return;
        try {
            const parsed = JSON.parse(await fs.readFile(storagePath, 'utf8'));
            if (Array.isArray(parsed?.orders) && Array.isArray(parsed?.processedEventIds)) {
                state = parsed;
            }
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
        loaded = true;
    }

    async function save() {
        await fs.mkdir(path.dirname(storagePath), { recursive: true });
        await fs.writeFile(storagePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    }

    function cleanOldRecords(now) {
        for (const order of state.orders) {
            if (order.status === 'pending' && Date.parse(order.expiresAt) <= now) {
                order.status = 'expired';
                order.finishedAt = new Date(now).toISOString();
            }
        }

        state.orders = state.orders.filter(order => {
            if (order.status === 'pending' || order.status === 'payment_confirmed' || order.status === 'role_failed') {
                return true;
            }
            const finishedAt = Date.parse(order.finishedAt ?? order.createdAt);
            return Number.isFinite(finishedAt) && now - finishedAt <= COMPLETED_ORDER_RETENTION_MS;
        });

        const retainedEventIds = new Set(
            state.orders.flatMap(order => Array.isArray(order.eventIds) ? order.eventIds : []),
        );
        state.processedEventIds = state.processedEventIds.filter(id => retainedEventIds.has(id));
    }

    function generateUniqueCode() {
        for (let attempt = 0; attempt < 20; attempt += 1) {
            const suffix = randomBytes(5).toString('hex').toUpperCase().slice(0, 6);
            const code = `OML-${suffix}`;
            if (!state.orders.some(order => order.code === code)) return code;
        }
        throw new Error('สร้างรหัส Gank ที่ไม่ซ้ำไม่สำเร็จ');
    }

    async function createOrder(input, now = Date.now()) {
        return withLock(async () => {
            await load();
            cleanOldRecords(now);

            const existing = state.orders.find(order => (
                order.status === 'pending'
                && order.discordUserId === input.discordUserId
                && order.configKey === input.configKey
                && Date.parse(order.expiresAt) > now
            ));
            if (existing) return { order: existing, reused: true };

            const order = {
                code: generateUniqueCode(),
                status: 'pending',
                discordUserId: input.discordUserId,
                discordTag: input.discordTag,
                guildId: input.guildId,
                configKey: input.configKey,
                roleId: input.roleId,
                roleName: input.roleName,
                requiredSatang: input.requiredSatang,
                receivedSatang: 0,
                eventIds: [],
                createdAt: new Date(now).toISOString(),
                expiresAt: new Date(now + orderTtlMs).toISOString(),
            };
            state.orders.push(order);
            await save();
            return { order, reused: false };
        });
    }

    async function applyAlert(alert, now = Date.now()) {
        return withLock(async () => {
            await load();
            if (state.processedEventIds.includes(alert.eventId)) {
                return { status: 'duplicate_event' };
            }

            const order = state.orders.find(candidate => candidate.code === alert.code);
            if (!order) return { status: 'unknown_code' };
            if (order.status !== 'pending') return { status: 'order_not_pending', order };
            if (Date.parse(order.expiresAt) <= now) {
                order.status = 'expired';
                order.finishedAt = new Date(now).toISOString();
                order.eventIds.push(alert.eventId);
                state.processedEventIds.push(alert.eventId);
                await save();
                return { status: 'expired', order };
            }

            order.receivedSatang += alert.amountSatang;
            order.eventIds.push(alert.eventId);
            state.processedEventIds.push(alert.eventId);
            order.lastDonationAt = new Date(now).toISOString();

            if (order.receivedSatang < order.requiredSatang) {
                await save();
                return { status: 'partial', order };
            }

            order.status = 'payment_confirmed';
            order.confirmedAt = new Date(now).toISOString();
            await save();
            return { status: 'ready_to_fulfill', order };
        });
    }

    async function finishOrder(code, status, details = {}, now = Date.now()) {
        return withLock(async () => {
            await load();
            const order = state.orders.find(candidate => candidate.code === code);
            if (!order) return null;
            order.status = status;
            order.finishedAt = new Date(now).toISOString();
            Object.assign(order, details);
            await save();
            return order;
        });
    }

    async function resetForTests() {
        await withLock(async () => {
            state = { orders: [], processedEventIds: [] };
            loaded = true;
            await save();
        });
    }

    return { createOrder, applyAlert, finishOrder, resetForTests };
}

module.exports = {
    ORDER_CODE_PATTERN,
    parseBahtToSatang,
    extractOrderCode,
    parseGankAlert,
    createOrderManager,
};
