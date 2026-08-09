const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
    buildCheckoutParams,
    getStripeRuntimeConfig,
    inspectPaidCheckoutSession,
    verifyStripeWebhookSignature,
} = require('../services/stripePayments')._internals;

const roleConfigByKey = {
    buy_test: {
        roleId: '123456789012345678',
        roleName: 'ห้องทดสอบ',
        amount: 20,
    },
};

function paidSession(overrides = {}) {
    return {
        id: 'cs_test_example',
        object: 'checkout.session',
        mode: 'payment',
        payment_status: 'paid',
        currency: 'thb',
        amount_total: 2_500,
        livemode: false,
        metadata: {
            provider: 'omelet_discord_role_v1',
            configKey: 'buy_test',
            discordUserId: '111111111111111111',
            guildId: '222222222222222222',
            roleId: '123456789012345678',
            requiredSatang: '2000',
        },
        ...overrides,
    };
}

test('ล็อกคีย์ Stripe live ไว้จนกว่าจะเปิด STRIPE_ALLOW_LIVE เอง', () => {
    assert.throws(() => getStripeRuntimeConfig({
        STRIPE_SECRET_KEY: 'sk_live_abc123',
        PUBLIC_BASE_URL: 'https://bot.example.com',
    }), /STRIPE_ALLOW_LIVE/);

    assert.equal(getStripeRuntimeConfig({
        STRIPE_SECRET_KEY: 'sk_test_abc123',
        PUBLIC_BASE_URL: 'https://bot.example.com',
    }).liveMode, false);
});

test('Checkout ใช้ PromptPay, THB, ยอดที่ผู้ใช้เลือก และผูก Discord ID ใน metadata', () => {
    const params = buildCheckoutParams({
        amountSatang: 2_500,
        configKey: 'buy_test',
        roleConfig: roleConfigByKey.buy_test,
        discordUserId: '111111111111111111',
        guildId: '222222222222222222',
        publicBaseUrl: 'https://bot.example.com',
        nowMs: 1_700_000_000_000,
    });

    assert.equal(params.get('payment_method_types[0]'), 'promptpay');
    assert.equal(params.get('line_items[0][price_data][currency]'), 'thb');
    assert.equal(params.get('line_items[0][price_data][unit_amount]'), '2500');
    assert.equal(params.get('metadata[discordUserId]'), '111111111111111111');
    assert.equal(params.get('metadata[configKey]'), 'buy_test');
    assert.match(params.get('success_url'), /\{CHECKOUT_SESSION_ID\}/);
});

test('ยอมรับ Checkout ที่ Stripe ยืนยันว่าจ่ายแล้วและยอดถึงขั้นต่ำ', () => {
    const result = inspectPaidCheckoutSession(paidSession(), roleConfigByKey);
    assert.equal(result.ok, true);
    assert.equal(result.amountSatang, 2_500);
    assert.equal(result.config.roleName, 'ห้องทดสอบ');
});

test('ปฏิเสธ webhook ที่ยังไม่จ่าย ยอดต่ำ หรือแก้ role metadata', () => {
    assert.equal(inspectPaidCheckoutSession(paidSession({ payment_status: 'unpaid' }), roleConfigByKey).reason, 'not_paid');
    assert.equal(inspectPaidCheckoutSession(paidSession({ amount_total: 1_999 }), roleConfigByKey).reason, 'insufficient_amount');

    const tampered = paidSession();
    tampered.metadata = { ...tampered.metadata, roleId: '999999999999999999' };
    assert.equal(inspectPaidCheckoutSession(tampered, roleConfigByKey).reason, 'unknown_role');
});

test('ตรวจลายเซ็น Stripe จาก raw body และปฏิเสธลายเซ็นปลอมหรือเก่า', () => {
    const endpointSecret = 'whsec_testsecret';
    const timestamp = 1_700_000_000;
    const payload = Buffer.from('{"id":"evt_test","type":"checkout.session.completed"}', 'utf8');
    const signature = crypto
        .createHmac('sha256', endpointSecret)
        .update(`${timestamp}.${payload.toString('utf8')}`)
        .digest('hex');
    const header = `t=${timestamp},v1=${signature}`;

    assert.equal(verifyStripeWebhookSignature(payload, header, endpointSecret, timestamp * 1_000), true);
    assert.equal(verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${'0'.repeat(64)}`, endpointSecret, timestamp * 1_000), false);
    assert.equal(verifyStripeWebhookSignature(payload, header, endpointSecret, (timestamp + 301) * 1_000), false);
});
