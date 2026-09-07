const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { parseGankAlert, createOrderManager } = require('../services/gankPayments');
const { parseStreamUserId } = require('../services/gankStream');

function alertPayload({
    id = 'event-1',
    amount = '20.00',
    currency = 'THB',
    message = 'OML-ABC123',
    testAlert = false,
} = {}) {
    return {
        eventType: 'ALERT_AND_TTS',
        data: {
            donationSetting: testAlert ? { stream_alert_variation_test: { name: 'Main' } } : {},
            mediaQueue: {
                id,
                donorName: 'Supporter',
                donorMessage: message,
                donationAmount: '0.60',
                donationAmountLocalCurrency: amount,
                donationLocalCurrency: currency,
            },
        },
    };
}

test('อ่านยอด THB ข้อความ และ event id จาก Gank Stream Alert', () => {
    assert.deepEqual(parseGankAlert(alertPayload()), {
        ok: true,
        eventId: 'event-1',
        code: 'OML-ABC123',
        amountSatang: 2_000,
        currency: 'THB',
        donorName: 'Supporter',
    });
});

test('Test Alert ถูกปฏิเสธก่อนเข้าระบบชำระเงิน', () => {
    assert.deepEqual(parseGankAlert(alertPayload({ testAlert: true })), {
        ok: false,
        reason: 'test_alert',
    });
});

test('ไม่ใช้ยอด USD เมื่อไม่มีจำนวนเงินสกุล THB ที่ตรวจสอบได้', () => {
    assert.equal(parseGankAlert(alertPayload({ currency: 'USD' })).reason, 'unsupported_currency');
    assert.equal(parseGankAlert(alertPayload({ amount: '20.001' })).reason, 'invalid_amount');
});

test('รับเฉพาะ Stream Alert URL หลัก ไม่รับ QR Code URL หรือโดเมนปลอม', () => {
    const id = '00000000-0000-4000-8000-000000000001';
    assert.equal(parseStreamUserId(`https://stream.ganknow.com/${id}`), id);
    assert.equal(parseStreamUserId(`https://stream.ganknow.com/${id}/qr-code`), null);
    assert.equal(parseStreamUserId(`https://evil.example/${id}`), null);
});

test('รายการราคาเท่ากันไม่ชนกัน เพราะผูกด้วยรหัสเฉพาะคนและตัวละคร', async () => {
    const storagePath = path.join(os.tmpdir(), `shopomelet-gank-orders-${process.pid}-${Date.now()}.json`);
    const manager = createOrderManager({ storagePath });
    const now = 1_000_000;

    try {
        const first = await manager.createOrder({
            discordUserId: 'user-a', discordTag: 'a', guildId: 'guild', configKey: 'buy_yuri',
            roleId: 'role-yuri', roleName: 'ยูริ', requiredSatang: 2_000,
        }, now);
        const second = await manager.createOrder({
            discordUserId: 'user-b', discordTag: 'b', guildId: 'guild', configKey: 'buy_muna',
            roleId: 'role-muna', roleName: 'มูนา', requiredSatang: 2_000,
        }, now);

        assert.notEqual(first.order.code, second.order.code);

        const firstResult = await manager.applyAlert({
            eventId: 'event-a', code: first.order.code, amountSatang: 2_000,
        }, now + 1_000);
        const secondResult = await manager.applyAlert({
            eventId: 'event-b', code: second.order.code, amountSatang: 2_000,
        }, now + 1_000);

        assert.equal(firstResult.status, 'ready_to_fulfill');
        assert.equal(firstResult.order.roleId, 'role-yuri');
        assert.equal(secondResult.status, 'ready_to_fulfill');
        assert.equal(secondResult.order.roleId, 'role-muna');
    } finally {
        await fs.rm(storagePath, { force: true });
    }
});

test('รวมยอดหลายครั้งด้วยรหัสเดิมและไม่คิด event ซ้ำ', async () => {
    const storagePath = path.join(os.tmpdir(), `shopomelet-gank-partial-${process.pid}-${Date.now()}.json`);
    const manager = createOrderManager({ storagePath });
    const now = 2_000_000;

    try {
        const { order } = await manager.createOrder({
            discordUserId: 'user-a', discordTag: 'a', guildId: 'guild', configKey: 'buy_yuri',
            roleId: 'role-yuri', roleName: 'ยูริ', requiredSatang: 2_000,
        }, now);

        assert.equal((await manager.applyAlert({ eventId: 'event-1', code: order.code, amountSatang: 1_200 }, now + 1)).status, 'partial');
        assert.equal((await manager.applyAlert({ eventId: 'event-1', code: order.code, amountSatang: 1_200 }, now + 2)).status, 'duplicate_event');
        const complete = await manager.applyAlert({ eventId: 'event-2', code: order.code, amountSatang: 800 }, now + 3);
        assert.equal(complete.status, 'ready_to_fulfill');
        assert.equal(complete.order.receivedSatang, 2_000);
    } finally {
        await fs.rm(storagePath, { force: true });
    }
});
