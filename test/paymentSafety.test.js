const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const gankOrderStorePath = path.join(os.tmpdir(), `shopomelet-gank-interaction-${process.pid}.json`);
process.env.GANK_ORDER_STORE_PATH = gankOrderStorePath;
process.env.GANK_STREAM_URL = 'https://stream.ganknow.com/00000000-0000-4000-8000-000000000001';

const interactionCreateEvent = require('../events/interactionCreate');
const {
    parseTrueMoneyLink,
    parseBahtToSatang,
    inspectVerifiedVoucher,
    inspectRedeemedVoucher,
    acquirePaymentSlot,
    releasePaymentSlot,
    resetPaymentStateForTests,
} = interactionCreateEvent._internals;

function verifyResponse({ amount = '20.00', member = 1, code = 'SUCCESS' } = {}) {
    return {
        status: { code },
        data: {
            voucher: {
                amount_baht: amount,
                member,
            },
        },
    };
}

test('รับเฉพาะลิงก์ HTTPS จาก gift.truemoney.com ที่มี voucher hash ถูกต้อง', () => {
    assert.equal(
        parseTrueMoneyLink('https://gift.truemoney.com/campaign/?v=AbCdEf123456'),
        'AbCdEf123456',
    );
    assert.equal(parseTrueMoneyLink('http://gift.truemoney.com/campaign/?v=AbCdEf123456'), null);
    assert.equal(parseTrueMoneyLink('https://evil.example/?next=https://gift.truemoney.com/campaign/?v=AbCdEf123456'), null);
    assert.equal(parseTrueMoneyLink('https://gift.truemoney.com/campaign/?v=short'), null);
    assert.equal(parseTrueMoneyLink('https://gift.truemoney.com/campaign/?v=AbCdEf123456&v=OtherHash99'), null);
});

test('แปลงเงินบาทเป็นสตางค์แบบจำนวนเต็มและปฏิเสธค่ากำกวม', () => {
    assert.equal(parseBahtToSatang('20'), 2_000);
    assert.equal(parseBahtToSatang('20.5'), 2_050);
    assert.equal(parseBahtToSatang('20.05'), 2_005);
    assert.equal(parseBahtToSatang('20abc'), null);
    assert.equal(parseBahtToSatang('NaN'), null);
    assert.equal(parseBahtToSatang('20.001'), null);
});

test('ซองคนเดียวที่ยอดถึงกำหนดผ่านการตรวจสอบ', () => {
    assert.deepEqual(inspectVerifiedVoucher(verifyResponse(), 2_000), {
        ok: true,
        amountSatang: 2_000,
        recipientCount: 1,
    });
});

test('ยอดต่ำกว่ากำหนดถูกปฏิเสธก่อน redeem', () => {
    assert.deepEqual(inspectVerifiedVoucher(verifyResponse({ amount: '9.99' }), 1_000), {
        ok: false,
        step: 'insufficient',
        amountSatang: 999,
    });
});

test('ซองหลายคนถูกปฏิเสธแม้ยอดรวมถึงราคา', () => {
    assert.deepEqual(inspectVerifiedVoucher(verifyResponse({ amount: '50.00', member: 5 }), 5_000), {
        ok: false,
        step: 'multi_recipient',
        recipientCount: 5,
    });
});

test('response ที่ไม่บอกจำนวนผู้รับถูกปฏิเสธแบบ fail closed', () => {
    const response = verifyResponse();
    delete response.data.voucher.member;
    assert.deepEqual(inspectVerifiedVoucher(response, 2_000), {
        ok: false,
        step: 'cannot_verify_recipient_count',
    });
});

test('ตรวจยอดที่ได้รับจาก redeem response อีกครั้ง', () => {
    const redeemResponse = {
        status: { code: 'SUCCESS' },
        data: { voucher: { redeemed_amount_baht: '9.00' } },
    };
    assert.deepEqual(inspectRedeemedVoucher(redeemResponse, 2_000, 1_000), {
        ok: false,
        step: 'redeemed_below_minimum',
        code: 'SUCCESS',
        amountSatang: 900,
    });
});

test('ถ้า redeem response ไม่มีจำนวนเงิน ใช้ยอด verify ได้เฉพาะ flow ซองคนเดียวที่ผ่านแล้ว', () => {
    assert.deepEqual(inspectRedeemedVoucher({ status: { code: 'SUCCESS' } }, 2_000, 2_000), {
        ok: true,
        code: 'SUCCESS',
        amountSatang: 2_000,
        amountSource: 'verified_single_recipient',
    });
});

test('กันผู้ใช้และ voucher เดิมทำงานซ้อนกัน', () => {
    resetPaymentStateForTests();
    const now = 100_000;
    assert.deepEqual(acquirePaymentSlot('user-1', 'voucher-1', now), { ok: true });
    assert.equal(acquirePaymentSlot('user-1', 'voucher-2', now).reason, 'user_busy');
    assert.equal(acquirePaymentSlot('user-2', 'voucher-1', now).reason, 'voucher_busy');
    releasePaymentSlot('user-1', 'voucher-1');
    assert.equal(acquirePaymentSlot('user-1', 'voucher-2', now).reason, 'cooldown');
});

test('จำกัดการตรวจซองพร้อมกันทั้งระบบไม่เกินสองงาน', () => {
    resetPaymentStateForTests();
    const now = 200_000;
    assert.deepEqual(acquirePaymentSlot('user-1', 'voucher-1', now), { ok: true });
    assert.deepEqual(acquirePaymentSlot('user-2', 'voucher-2', now), { ok: true });
    assert.equal(acquirePaymentSlot('user-3', 'voucher-3', now).reason, 'system_busy');
    releasePaymentSlot('user-1', 'voucher-1');
    releasePaymentSlot('user-2', 'voucher-2');
});

test.after(async () => {
    await fs.rm(gankOrderStorePath, { force: true });
});

test('ปุ่มตัวละครสร้างรายการ Gank ที่ผูกกับ Discord user และยศ', async () => {
    let reply;
    await interactionCreateEvent.execute({
        isButton: () => true,
        customId: 'buy_yuri',
        user: { id: 'discord-user-1', tag: 'tester#0001' },
        guildId: 'guild-1',
        reply: async value => { reply = value; },
    });

    assert.match(reply.content, /ยูริ — 12 บาท/);
    assert.match(reply.content, /OML-[A-Z0-9]{6}/);
    assert.equal(reply.flags, 64);
    assert.equal(reply.components[0].toJSON().components[0].url, 'https://ganknow.com/omelettt1101/tip');
});

test('ปุ่ม custom id รุ่นเดิมถูกเปลี่ยนไปสร้างรายการ Gank เช่นกัน', async () => {
    let reply;
    await interactionCreateEvent.execute({
        isButton: () => true,
        customId: 'pay_truemoney:buy_yuri',
        user: { id: 'discord-user-2', tag: 'tester#0002' },
        guildId: 'guild-1',
        reply: async value => { reply = value; },
    });

    assert.match(reply.content, /OML-[A-Z0-9]{6}/);
    assert.equal(reply.components[0].toJSON().components[0].label, 'เปิดหน้าจ่ายเงิน Gank');
});
