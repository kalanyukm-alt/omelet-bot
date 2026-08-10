const crypto = require('node:crypto');
const { PermissionFlagsBits } = require('discord.js');
const { recordTransactionAudit } = require('./transactionAudit');
const { formatDiscordIdentity, sendLog } = require('./discordLog');

const STRIPE_API_BASE = 'https://api.stripe.com/v1';
const CHECKOUT_EXPIRY_SECONDS = 31 * 60;
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
const DEFAULT_MAX_AMOUNT_BAHT = 5_000;

class StripeConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'StripeConfigError';
    }
}

class StripeApiError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'StripeApiError';
        this.status = status;
    }
}

function normalizePublicBaseUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new StripeConfigError('PUBLIC_BASE_URL ต้องเป็น URL ที่เปิดจากอินเทอร์เน็ตได้');
    }

    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !isLocalhost) {
        throw new StripeConfigError('PUBLIC_BASE_URL ต้องใช้ HTTPS');
    }

    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
}

function getStripeRuntimeConfig(env = process.env) {
    const secretKey = env.STRIPE_SECRET_KEY?.trim();
    if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(secretKey ?? '')) {
        throw new StripeConfigError('ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY');
    }

    const liveMode = secretKey.startsWith('sk_live_');
    if (liveMode && env.STRIPE_ALLOW_LIVE !== 'true') {
        throw new StripeConfigError('คีย์จริงถูกล็อกไว้ ต้องตั้ง STRIPE_ALLOW_LIVE=true หลังทดสอบผ่านเท่านั้น');
    }

    const maxAmountBaht = Number(env.STRIPE_MAX_AMOUNT_BAHT ?? DEFAULT_MAX_AMOUNT_BAHT);
    if (!Number.isSafeInteger(maxAmountBaht) || maxAmountBaht < 1 || maxAmountBaht > 1_000_000) {
        throw new StripeConfigError('STRIPE_MAX_AMOUNT_BAHT ไม่ถูกต้อง');
    }

    return {
        secretKey,
        liveMode,
        maxAmountSatang: maxAmountBaht * 100,
        publicBaseUrl: normalizePublicBaseUrl(env.PUBLIC_BASE_URL),
    };
}

function getStripeStatus(env = process.env) {
    try {
        const config = getStripeRuntimeConfig(env);
        return { enabled: true, mode: config.liveMode ? 'live' : 'test' };
    } catch (error) {
        return { enabled: false, reason: error.message };
    }
}

function buildCheckoutParams({
    amountSatang,
    configKey,
    roleConfig,
    discordUserId,
    guildId,
    publicBaseUrl,
    nowMs = Date.now(),
}) {
    const params = new URLSearchParams();
    const metadata = {
        provider: 'omelet_discord_role_v1',
        configKey,
        discordUserId,
        guildId,
        roleId: roleConfig.roleId,
        requiredSatang: String(roleConfig.amount * 100),
    };

    params.set('mode', 'payment');
    params.set('payment_method_types[0]', 'promptpay');
    params.set('line_items[0][price_data][currency]', 'thb');
    params.set('line_items[0][price_data][unit_amount]', String(amountSatang));
    params.set('line_items[0][price_data][product_data][name]', `สิทธิ์เข้าถึงห้อง Discord: ${roleConfig.roleName}`);
    params.set('line_items[0][quantity]', '1');
    params.set('client_reference_id', discordUserId);
    params.set('locale', 'th');
    params.set('expires_at', String(Math.floor(nowMs / 1_000) + CHECKOUT_EXPIRY_SECONDS));
    params.set('success_url', `${publicBaseUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}`);
    params.set('cancel_url', `${publicBaseUrl}/stripe/cancel`);

    for (const [key, value] of Object.entries(metadata)) {
        params.set(`metadata[${key}]`, value);
        params.set(`payment_intent_data[metadata][${key}]`, value);
    }

    return params;
}

async function createPromptPayCheckoutSession({
    amountSatang,
    configKey,
    roleConfig,
    discordUserId,
    guildId,
    env = process.env,
    fetchImpl = globalThis.fetch,
}) {
    const runtime = getStripeRuntimeConfig(env);
    if (!Number.isSafeInteger(amountSatang) || amountSatang < roleConfig.amount * 100) {
        throw new Error('จำนวนเงินต่ำกว่าขั้นต่ำของยศ');
    }
    if (amountSatang > runtime.maxAmountSatang) {
        throw new Error(`จำนวนเงินสูงเกินกำหนด (สูงสุด ${runtime.maxAmountSatang / 100} บาท)`);
    }
    if (!/^\d{15,22}$/.test(discordUserId) || !/^\d{15,22}$/.test(guildId)) {
        throw new Error('Discord user หรือ server ID ไม่ถูกต้อง');
    }

    const params = buildCheckoutParams({
        amountSatang,
        configKey,
        roleConfig,
        discordUserId,
        guildId,
        publicBaseUrl: runtime.publicBaseUrl,
    });
    const idempotencyKey = `discord-checkout-${crypto.randomUUID()}`;
    let response;

    try {
        response = await fetchImpl(`${STRIPE_API_BASE}/checkout/sessions`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${runtime.secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Idempotency-Key': idempotencyKey,
            },
            body: params,
            signal: AbortSignal.timeout(15_000),
        });
    } catch (error) {
        throw new StripeApiError(`เชื่อมต่อ Stripe ไม่สำเร็จ: ${error.message}`);
    }

    let body;
    try {
        body = await response.json();
    } catch {
        throw new StripeApiError('Stripe ส่งข้อมูลตอบกลับที่อ่านไม่ได้', response.status);
    }

    if (!response.ok) {
        throw new StripeApiError(body?.error?.message ?? 'Stripe ปฏิเสธการสร้างหน้าชำระเงิน', response.status);
    }
    if (!/^cs_(test|live)_/.test(body?.id ?? '') || typeof body?.url !== 'string') {
        throw new StripeApiError('Stripe ไม่ได้ส่ง Checkout URL ที่ถูกต้อง', response.status);
    }
    if (Boolean(body.livemode) !== runtime.liveMode) {
        throw new StripeApiError('โหมดของ Checkout ไม่ตรงกับคีย์ Stripe');
    }

    await recordTransactionAudit({
        provider: 'stripe',
        status: 'checkout_created',
        stripeSessionId: body.id,
        livemode: body.livemode,
        amountSatang,
        discordUserId,
        guildId,
        roleId: roleConfig.roleId,
        roleName: roleConfig.roleName,
    });

    return { id: body.id, url: body.url, livemode: body.livemode };
}

function parseStripeSignatureHeader(signatureHeader) {
    const result = { timestamp: null, signatures: [] };
    if (typeof signatureHeader !== 'string') return result;

    for (const part of signatureHeader.split(',')) {
        const separator = part.indexOf('=');
        if (separator === -1) continue;
        const key = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        if (key === 't' && /^\d+$/.test(value)) result.timestamp = Number(value);
        if (key === 'v1' && /^[a-f0-9]{64}$/i.test(value)) result.signatures.push(value.toLowerCase());
    }

    return result;
}

function verifyStripeWebhookSignature(
    rawBody,
    signatureHeader,
    endpointSecret,
    nowMs = Date.now(),
    toleranceSeconds = WEBHOOK_TOLERANCE_SECONDS,
) {
    if (!Buffer.isBuffer(rawBody) || !endpointSecret?.startsWith('whsec_')) return false;

    const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
    if (!Number.isSafeInteger(timestamp) || signatures.length === 0) return false;
    if (Math.abs(Math.floor(nowMs / 1_000) - timestamp) > toleranceSeconds) return false;

    const expected = crypto
        .createHmac('sha256', endpointSecret)
        .update(`${timestamp}.${rawBody.toString('utf8')}`)
        .digest();

    return signatures.some(signature => {
        const candidate = Buffer.from(signature, 'hex');
        return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
    });
}

function inspectPaidCheckoutSession(session, roleConfigByKey) {
    const metadata = session?.metadata;
    if (session?.object !== 'checkout.session' || metadata?.provider !== 'omelet_discord_role_v1') {
        return { ok: false, reason: 'unknown_session' };
    }

    const config = roleConfigByKey[metadata.configKey];
    if (!config || metadata.roleId !== config.roleId) {
        return { ok: false, reason: 'unknown_role' };
    }
    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
        return { ok: false, reason: 'not_paid' };
    }
    if (session.currency !== 'thb' || !Number.isSafeInteger(session.amount_total)) {
        return { ok: false, reason: 'invalid_amount' };
    }

    const minimumSatang = config.amount * 100;
    if (metadata.requiredSatang !== String(minimumSatang) || session.amount_total < minimumSatang) {
        return { ok: false, reason: 'insufficient_amount' };
    }
    if (!/^\d{15,22}$/.test(metadata.discordUserId ?? '') || !/^\d{15,22}$/.test(metadata.guildId ?? '')) {
        return { ok: false, reason: 'invalid_discord_target' };
    }

    return {
        ok: true,
        config,
        configKey: metadata.configKey,
        discordUserId: metadata.discordUserId,
        guildId: metadata.guildId,
        amountSatang: session.amount_total,
    };
}

async function fulfillPaidCheckoutSession(client, session, roleConfigByKey) {
    const inspected = inspectPaidCheckoutSession(session, roleConfigByKey);
    const auditBase = {
        provider: 'stripe',
        stripeSessionId: session?.id,
        stripePaymentIntentId: typeof session?.payment_intent === 'string' ? session.payment_intent : undefined,
        livemode: Boolean(session?.livemode),
    };

    if (!inspected.ok) {
        await recordTransactionAudit({ ...auditBase, status: 'stripe_session_rejected', reason: inspected.reason });
        await sendLog(client, `🔴 **[Stripe Session ถูกปฏิเสธ]** Session: \`${session?.id ?? 'unknown'}\` เหตุผล: \`${inspected.reason}\``);
        return { ok: false, retryable: false, reason: inspected.reason };
    }

    if (!client.isReady()) {
        await recordTransactionAudit({ ...auditBase, status: 'stripe_discord_not_ready' });
        return { ok: false, retryable: true, reason: 'discord_not_ready' };
    }

    const { config, discordUserId, guildId, amountSatang } = inspected;
    const fulfillmentAudit = {
        ...auditBase,
        discordUserId,
        guildId,
        roleId: config.roleId,
        roleName: config.roleName,
        actualAmountSatang: amountSatang,
    };

    let guild;
    try {
        guild = client.guilds.cache.get(guildId) ?? await client.guilds.fetch(guildId);
    } catch (error) {
        await recordTransactionAudit({ ...fulfillmentAudit, status: 'stripe_guild_missing', error: error.message });
        await sendLog(client, `🔴 **[Stripe รับเงินแล้ว แต่ไม่พบเซิร์ฟเวอร์]** User ID: \`${discordUserId}\` Session: \`${session.id}\``);
        return { ok: false, retryable: true, reason: 'guild_missing' };
    }

    let member;
    let role;
    let botMember;
    try {
        [member, role, botMember] = await Promise.all([
            guild.members.fetch(discordUserId),
            guild.roles.fetch(config.roleId),
            guild.members.fetchMe(),
        ]);
    } catch (error) {
        await recordTransactionAudit({ ...fulfillmentAudit, status: 'stripe_target_fetch_failed', error: error.message });
        await sendLog(client, `🔴 **[Stripe รับเงินแล้ว แต่ค้นหาสมาชิก/ยศไม่สำเร็จ]** User ID: \`${discordUserId}\` Session: \`${session.id}\``);
        return { ok: false, retryable: true, reason: 'target_fetch_failed' };
    }

    const discordIdentity = formatDiscordIdentity(member.user, discordUserId);

    if (!role || role.managed || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)
        || botMember.roles.highest.comparePositionTo(role) <= 0) {
        await recordTransactionAudit({ ...fulfillmentAudit, status: 'stripe_role_unavailable' });
        await sendLog(client, `🔴 **[Stripe รับเงินแล้ว แต่บอทให้ยศไม่ได้]** ${discordIdentity} ยศ: **${config.roleName}** Session: \`${session.id}\``);
        return { ok: false, retryable: false, reason: 'role_unavailable' };
    }

    if (member.roles.cache.has(role.id)) {
        await recordTransactionAudit({ ...fulfillmentAudit, status: 'stripe_role_already_present' });
        return { ok: true, alreadyGranted: true };
    }

    try {
        await member.roles.add(role, `Stripe PromptPay ${amountSatang / 100} baht; session ${session.id}`);
    } catch (error) {
        await recordTransactionAudit({ ...fulfillmentAudit, status: 'stripe_role_failed', error: error.message });
        await sendLog(client, `🔴 **[Stripe รับเงินแล้ว แต่เพิ่มยศล้มเหลว — ระบบจะลองใหม่]** ${discordIdentity} Session: \`${session.id}\``);
        return { ok: false, retryable: true, reason: 'role_add_failed' };
    }

    await recordTransactionAudit({ ...fulfillmentAudit, status: 'stripe_role_granted' });
    await sendLog(client, `🟢 **[Stripe PromptPay สำเร็จ]** ${discordIdentity} จ่าย **${amountSatang / 100} บาท** → ได้รับยศ **${config.roleName}**`);
    return { ok: true, alreadyGranted: false };
}

function createStripeWebhookHandler({ client, roleConfigByKey, env = process.env }) {
    return async function stripeWebhookHandler(req, res) {
        const endpointSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!endpointSecret?.startsWith('whsec_')) {
            console.error('[STRIPE] ยังไม่ได้ตั้งค่า STRIPE_WEBHOOK_SECRET');
            return res.status(503).send('Stripe webhook is not configured');
        }

        if (!verifyStripeWebhookSignature(req.body, req.headers['stripe-signature'], endpointSecret)) {
            return res.status(400).send('Invalid Stripe signature');
        }

        let event;
        try {
            event = JSON.parse(req.body.toString('utf8'));
        } catch {
            return res.status(400).send('Invalid JSON');
        }

        if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
            return res.status(200).json({ received: true });
        }

        try {
            const result = await fulfillPaidCheckoutSession(client, event.data?.object, roleConfigByKey);
            if (!result.ok && result.retryable) {
                return res.status(500).send('Role fulfillment failed; retry requested');
            }
            return res.status(200).json({ received: true });
        } catch (error) {
            console.error('[STRIPE] webhook fulfillment error:', error);
            return res.status(500).send('Webhook processing failed');
        }
    };
}

module.exports = {
    createPromptPayCheckoutSession,
    createStripeWebhookHandler,
    getStripeStatus,
    StripeConfigError,
    StripeApiError,
    _internals: {
        buildCheckoutParams,
        getStripeRuntimeConfig,
        inspectPaidCheckoutSession,
        parseStripeSignatureHeader,
        verifyStripeWebhookSignature,
        fulfillPaidCheckoutSession,
    },
};
