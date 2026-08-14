const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionFlagsBits,
} = require('discord.js');
const { chromium } = require('playwright'); // 📌 อาวุธทะลวงเกราะของเรา (ห้ามทิ้งเด็ดขาด!)
const crypto = require('node:crypto');
const { recordTransactionAudit } = require('../services/transactionAudit');
const { formatDiscordIdentity, sendLog } = require('../services/discordLog');

// ===== CONFIG: ข้อมูลตัวละคร (เพิ่มตัวใหม่แค่มาแก้ตรงนี้) =====
const ROLE_CONFIG = {
    buy_yuri:   { modalId: 'modal_yuri',  title: 'โดเนทให้ ยูริ (12 บาท)',  roleId: '1489704389198217367', roleName: 'ยูริ',  amount: 12  },
    buy_sena:   { modalId: 'modal_sena',  title: 'โดเนทให้ เซนะ (10 บาท)',  roleId: '1489705449094643872', roleName: 'เซนะ',  amount: 10  },
    buy_mirei:  { modalId: 'modal_mirei', title: 'โดเนทให้ มิเรย์ (20 บาท)', roleId: '1493224189841117278', roleName: 'มิเรย์', amount: 20  },
    buy_lalin:  { modalId: 'modal_lalin', title: 'โดเนทให้ ลลิน (15 บาท)',  roleId: '1492199679977586752', roleName: 'ลลิน',  amount: 15  },
    buy_yurim4: { modalId: 'modal_yurim4', title: 'โดเนทให้ ยูริ M4 (15 บาท)', roleId: '1492549297617502279', roleName: 'ยูริ M4', amount: 15 }, // 🎀 เพิ่มของ ยูริ M4 เรียบร้อย!
    buy_mirei_president: { modalId: 'modal_mirei_president', title: 'โดเนทให้ มิเรย์ - ประธานนักเรียน (15 บาท)', roleId: '1493215773663952906', roleName: 'มิเรย์ - ประธานนักเรียน', amount: 15 }, // 🍇 เพิ่มของ มิเรย์ - ประธานนักเรียน เรียบร้อย!
    buy_momoka: { modalId: 'modal_momoka', title: 'โดเนทให้ โมโมกะ (14 บาท)', roleId: '1493670409110028469', roleName: 'โมโมกะ', amount: 14 }, // 🧁 เพิ่มของ โมโมกะ เรียบร้อย!
    buy_melle: { modalId: 'modal_melle', title: 'โดเนทให้ เมล (14 บาท)', roleId: '1494326775314911242', roleName: 'เมล', amount: 14 }, // 🌸 เพิ่มของ เมล เรียบร้อย!
    buy_nillaya: { modalId: 'modal_nillaya', title: 'โดเนทให้ นิลยา (10 บาท)', roleId: '1495476449275023552', roleName: 'นิลยา', amount: 10 }, // ♣️ เพิ่มของ นิลยา เรียบร้อย!
    buy_jian: { modalId: 'modal_jian', title: 'โดเนทให้ จีอัน (10 บาท)', roleId: '1495986170411090000', roleName: 'จีอัน', amount: 10 }, // 🍆 เพิ่มของ จีอัน เรียบร้อย!
    buy_prim: { modalId: 'modal_prim', title: 'โดเนทให้ พริม (15 บาท)', roleId: '1495986401727090798', roleName: 'พริม', amount: 15 }, // 🐑 เพิ่มของ พริม เรียบร้อย!
    buy_jimin: { modalId: 'modal_jimin', title: 'โดเนทให้ จีมิน (15 บาท)', roleId: '1496895025156722688', roleName: 'จีมิน', amount: 15 }, // 🐾 เพิ่มของ จีมิน เรียบร้อย!
    buy_colette: { modalId: 'modal_colette', title: 'โดเนทให้ โคเล็ตต์ (12 บาท)', roleId: '1497209324005494944', roleName: 'โคเล็ตต์', amount: 12 }, // 🍦 เพิ่มของ โคเล็ตต์ เรียบร้อย!
    buy_florencia: { modalId: 'modal_florencia', title: 'โดเนทให้ ฟลอเรนเซีย (10 บาท)', roleId: '1499107236587245668', roleName: 'ฟลอเรนเซีย', amount: 10 }, // 🍧 เพิ่มของ ฟลอเรนเซีย เรียบร้อย!
    buy_lume: { modalId: 'modal_lume', title: 'โดเนทให้ ลูเม (10 บาท)', roleId: '1499995613649961000', roleName: 'ลูเม', amount: 10 }, // 🧸 เพิ่มของ ลูเม เรียบร้อย!
    buy_arcania: { modalId: 'modal_arcania', title: 'โดเนทให้ อาร์คาเนีย (10 บาท)', roleId: '1499995786069409812', roleName: 'อาร์คาเนีย', amount: 10 }, // 🐕 เพิ่มของ อาร์คาเนีย เรียบร้อย!
    buy_nethera: { modalId: 'modal_nethera', title: 'โดเนทให้ เนเธอร่า (10 บาท)', roleId: '1501427896278061136', roleName: 'เนเธอร่า', amount: 10 }, // 🧤 เพิ่มของ เนเธอร่า เรียบร้อย!
    buy_miraciel: { modalId: 'modal_miraciel', title: 'โดเนทให้ มิราเชียล (15 บาท)', roleId: '1502562825116323881', roleName: 'มิราเชียล', amount: 15 }, // 🔮 เพิ่มของ มิราเชียล เรียบร้อย!
    buy_mercia: { modalId: 'modal_mercia', title: 'โดเนทให้ เมอร์เซีย (15 บาท)', roleId: '1504571357520986304', roleName: 'เมอร์เซีย', amount: 15 }, // 🌹 เพิ่มของ เมอร์เซีย เรียบร้อย!
    buy_somjeed: { modalId: 'modal_somjeed', title: 'โดเนทให้ ส้มจี๊ด (20 บาท)', roleId: '1517102688779767829', roleName: 'ส้มจี๊ด', amount: 20 }, // 🍹 เพิ่มของ ส้มจี๊ด เรียบร้อย!
    buy_muna: { modalId: 'modal_muna', title: 'โดเนทให้ มูนา (20 บาท)', roleId: '1517943037253128406', roleName: 'มูนา', amount: 20 }, // 🖤 เพิ่มของ มูนา เรียบร้อย!
    buy_lalinn: { modalId: 'modal_lalinn', title: 'โดเนทให้ ลลิล (20 บาท)', roleId: '1518995242269937836', roleName: 'ลลิล', amount: 20 }, // 🤍 เพิ่มของ ลลิล เรียบร้อย!
    buy_cherry: { modalId: 'modal_cherry', title: 'โดเนทให้ เชอร์รี่ (20 บาท)', roleId: '1520031790243254312', roleName: 'เชอร์รี่', amount: 20 }, // 🍒 เพิ่มของ เชอร์รี่ เรียบร้อย!
    buy_ava: { modalId: 'modal_ava', title: 'โดเนทให้ เอวา (20 บาท)', roleId: '1520368884828475402', roleName: 'เอวา', amount: 20 }, // 📯 เพิ่มของ เอวา เรียบร้อย!
    buy_ilsier: { modalId: 'modal_ilsier', title: 'โดเนทให้ อิลเซียร์ (10 บาท)', roleId: '1520928768900993085', roleName: 'อิลเซียร์', amount: 10 }, // 🩵 เพิ่มของ อิลเซียร์ เรียบร้อย!
    buy_pinky: { modalId: 'modal_pinky', title: 'โดเนทให้ พิงกี้ (20 บาท)', roleId: '1522943041709805720', roleName: 'พิงกี้', amount: 20 }, // 👝 เพิ่มของ พิงกี้ เรียบร้อย!
    buy_kira: { modalId: 'modal_kira', title: 'โดเนทให้ คิรา (20 บาท)', roleId: '1525202804476743772', roleName: 'คิรา', amount: 20 }, // 🔮 เพิ่มของ คิรา เรียบร้อย!
    buy_ellie: { modalId: 'modal_ellie', title: 'โดเนทให้ เอลลี่ (20 บาท)', roleId: '1525206620777349140', roleName: 'เอลลี่', amount: 20 }, // ✨ เพิ่มของ เอลลี่ เรียบร้อย!
    buy_mochi: { modalId: 'modal_mochi', title: 'โดเนทให้ โมจิ (20 บาท)', roleId: '1525756834860896366', roleName: 'โมจิ', amount: 20 }, // 🩷 เพิ่มของ โมจิ เรียบร้อย!
    buy_pearl: { modalId: 'modal_pearl', title: 'โดเนทให้ เพิร์ล (20 บาท)', roleId: '1525758230427598908', roleName: 'เพิร์ล', amount: 20 }, // 🥻 เพิ่มของ เพิร์ล เรียบร้อย!
    buy_mina: { modalId: 'modal_mina', title: 'โดเนทให้ มีนา (50 บาท)', roleId: '1530063180968103996', roleName: 'มีนา', amount: 50 }, // 🖤 เพิ่มของ มีนา เรียบร้อย!
    buy_morvea: { modalId: 'modal_morvea', title: 'โดเนทให้ มอร์เวีย (50 บาท)', roleId: '1530765429402763315', roleName: 'มอร์เวีย', amount: 50 }, // 🤎 เพิ่มของ มอร์เวีย เรียบร้อย!
    buy_ivy: { modalId: 'modal_ivy', title: 'โดเนทให้ ไอวี่ (50 บาท)', roleId: '1531485909655093438', roleName: 'ไอวี่', amount: 50 }, // 🧈 เพิ่มของ ไอวี่ เรียบร้อย!
    buy_siya: { modalId: 'modal_siya', title: 'โดเนทให้ ซียา (50 บาท)', roleId: '1532699925371158558', roleName: 'ซียา', amount: 50 }, // 💄 เพิ่มของ ซียาเรียบร้อย!
    buy_pim: { modalId: 'modal_pim', title: 'โดเนทให้ พิม (50 บาท)', roleId: '1532978616529588355', roleName: 'พิม', amount: 50 }, // 🍥 เพิ่มของ พิม เรียบร้อย!
    buy_mew: { modalId: 'modal_mew', title: 'โดเนทให้ มิว (50 บาท)', roleId: '1535289114566336543', roleName: 'มิว', amount: 50 }, // 🍑 เพิ่มของ มิว เรียบร้อย!
    buy_mook: {modalId: 'modal_mook', title: 'โดเนทให้ มุก (50 บาท)', roleId: '1535535694271881307', roleName: 'มุก', amount: 50}, // 🖤 เพิ่มของมุก เรียบร้อย!
    buy_nari: { modalId: 'modal_nari', title: 'โดเนทให้ นาริ (55 บาท)', roleId: '1535866569295405137', roleName: 'นาริ', amount: 55 }, // 🖤 เพิ่มของ นาริ เรียบร้อย!
    buy_sia: { modalId: 'modal_sia', title: 'โดเนทให้ เซีย (55 บาท)', roleId: '1536518835161800825', roleName: 'เซีย', amount: 55 }, // 🤍 เพิ่มของ เซีย เรียบร้อย!
    buy_praew: { modalId: 'modal_praew', title: 'โดเนทให้ แพรว (50 บาท)', roleId: '1537670593875410974', roleName: 'แพรว', amount: 50 }, // 💜 เพิ่มของ แพรว เรียบร้อย!
}; 

const MODAL_TO_CONFIG = Object.fromEntries(
    Object.values(ROLE_CONFIG).map(cfg => [cfg.modalId, cfg])
);

const USER_COOLDOWN_MS = 15_000;
const MAX_CONCURRENT_PAYMENTS = 2;
const TRUE_MONEY_REQUEST_TIMEOUT_MS = 15_000;
const TRUE_MONEY_BUTTON_PREFIX = 'pay_truemoney:';
const activeUsers = new Set();
const activeVouchers = new Set();
const userCooldowns = new Map();
let activePaymentCount = 0;

function parseTrueMoneyLink(value) {
    if (typeof value !== 'string' || value.length > 300) return null;

    try {
        const url = new URL(value.trim());
        const voucherHash = url.searchParams.get('v');
        const hasOneVoucherHash = url.searchParams.getAll('v').length === 1;

        if (
            url.protocol !== 'https:' ||
            url.hostname !== 'gift.truemoney.com' ||
            url.pathname !== '/campaign/' ||
            !hasOneVoucherHash ||
            !/^[a-zA-Z0-9]{8,128}$/.test(voucherHash ?? '')
        ) {
            return null;
        }

        return voucherHash;
    } catch {
        return null;
    }
}

function parseBahtToSatang(raw) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const value = String(raw).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;

    const [bahtPart, satangPart = ''] = value.split('.');
    const satang = (Number(bahtPart) * 100) + Number(satangPart.padEnd(2, '0'));
    return Number.isSafeInteger(satang) && satang > 0 ? satang : null;
}

function formatSatang(satang) {
    return (satang / 100).toLocaleString('th-TH', {
        minimumFractionDigits: satang % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    });
}

function readRecipientCount(data) {
    const raw = data?.voucher?.member
        ?? data?.voucher?.member_count
        ?? data?.voucher?.recipient_count
        ?? data?.voucher_profile?.member
        ?? data?.member
        ?? null;

    if (Array.isArray(raw)) return raw.length;
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const count = Number(raw);
    return Number.isInteger(count) && count > 0 ? count : null;
}

function inspectVerifiedVoucher(verifyData, requiredSatang) {
    const verifyCode = verifyData?.status?.code;
    if (verifyCode !== 'SUCCESS') {
        return { ok: false, step: 'verify_failed', code: verifyCode ?? 'UNKNOWN' };
    }

    const data = verifyData?.data;
    const recipientCount = readRecipientCount(data);
    if (recipientCount === null) {
        return { ok: false, step: 'cannot_verify_recipient_count' };
    }
    if (recipientCount !== 1) {
        return { ok: false, step: 'multi_recipient', recipientCount };
    }

    const rawAmount = data?.voucher?.amount_baht
        ?? data?.voucher_profile?.amount_baht
        ?? data?.amount_baht
        ?? data?.voucher?.amount
        ?? null;
    const amountSatang = parseBahtToSatang(rawAmount);

    if (amountSatang === null) {
        return { ok: false, step: 'cannot_read_amount' };
    }
    if (amountSatang < requiredSatang) {
        return { ok: false, step: 'insufficient', amountSatang };
    }

    return { ok: true, amountSatang, recipientCount };
}

function inspectRedeemedVoucher(redeemData, verifiedAmountSatang, requiredSatang) {
    const code = redeemData?.status?.code ?? 'UNKNOWN';
    if (code !== 'SUCCESS') {
        return { ok: false, step: 'redeem_failed', code };
    }

    const data = redeemData?.data;
    const rawActualAmount = data?.my_ticket?.amount_baht
        ?? data?.ticket?.amount_baht
        ?? data?.redeemed_amount_baht
        ?? data?.amount_baht
        ?? data?.voucher?.redeemed_amount_baht
        ?? null;
    const parsedActualAmount = rawActualAmount === null ? null : parseBahtToSatang(rawActualAmount);
    const actualAmountSatang = parsedActualAmount ?? verifiedAmountSatang;

    if (actualAmountSatang < requiredSatang) {
        return {
            ok: false,
            step: 'redeemed_below_minimum',
            code,
            amountSatang: actualAmountSatang,
        };
    }

    return {
        ok: true,
        code,
        amountSatang: actualAmountSatang,
        amountSource: parsedActualAmount === null ? 'verified_single_recipient' : 'redeem_response',
    };
}

function pruneCooldowns(now) {
    if (userCooldowns.size < 1_000) return;
    for (const [userId, startedAt] of userCooldowns) {
        if (now - startedAt >= USER_COOLDOWN_MS) userCooldowns.delete(userId);
    }
}

function acquirePaymentSlot(userId, voucherHash, now = Date.now()) {
    pruneCooldowns(now);
    const lastStartedAt = userCooldowns.get(userId);

    if (activeUsers.has(userId)) return { ok: false, reason: 'user_busy' };
    if (lastStartedAt && now - lastStartedAt < USER_COOLDOWN_MS) {
        return {
            ok: false,
            reason: 'cooldown',
            retryAfterSeconds: Math.ceil((USER_COOLDOWN_MS - (now - lastStartedAt)) / 1_000),
        };
    }
    if (activeVouchers.has(voucherHash)) return { ok: false, reason: 'voucher_busy' };
    if (activePaymentCount >= MAX_CONCURRENT_PAYMENTS) return { ok: false, reason: 'system_busy' };

    userCooldowns.set(userId, now);
    activeUsers.add(userId);
    activeVouchers.add(voucherHash);
    activePaymentCount += 1;
    return { ok: true };
}

function releasePaymentSlot(userId, voucherHash) {
    activeUsers.delete(userId);
    activeVouchers.delete(voucherHash);
    activePaymentCount = Math.max(0, activePaymentCount - 1);
}

async function getFulfillmentTarget(interaction, config) {
    if (!interaction.inGuild() || !interaction.guild) {
        return { ok: false, message: '❌ ระบบรับซองได้เฉพาะในเซิร์ฟเวอร์ Discord เท่านั้นครับ' };
    }

    const [member, role, botMember] = await Promise.all([
        interaction.guild.members.fetch(interaction.user.id),
        interaction.guild.roles.fetch(config.roleId),
        interaction.guild.members.fetchMe(),
    ]);

    if (!role) {
        return { ok: false, message: '❌ ยังไม่พบยศนี้ในเซิร์ฟเวอร์ ระบบยังไม่ได้รับเงิน กรุณาแจ้งแอดมินครับ' };
    }
    if (
        role.managed ||
        !botMember.permissions.has(PermissionFlagsBits.ManageRoles) ||
        botMember.roles.highest.comparePositionTo(role) <= 0
    ) {
        return { ok: false, message: '❌ บอทยังไม่สามารถมอบยศนี้ได้ ระบบยังไม่ได้รับเงิน กรุณาแจ้งแอดมินให้ตรวจสิทธิ์และลำดับยศครับ' };
    }

    return { ok: true, member, role };
}

function voucherFingerprint(voucherHash) {
    return crypto.createHash('sha256').update(voucherHash).digest('hex');
}

async function fetchJsonInsidePage(page, url, options = {}) {
    return page.evaluate(async ({ requestUrl, requestOptions, timeoutMs }) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(requestUrl, { ...requestOptions, signal: controller.signal });
            const text = await response.text();
            let body;
            try {
                body = JSON.parse(text);
            } catch {
                return { httpOk: false, httpStatus: response.status, invalidJson: true, body: null };
            }
            return { httpOk: response.ok, httpStatus: response.status, invalidJson: false, body };
        } finally {
            clearTimeout(timeout);
        }
    }, { requestUrl: url, requestOptions: options, timeoutMs: TRUE_MONEY_REQUEST_TIMEOUT_MS });
}

function buildTrueMoneyModal(config) {
    const modal = new ModalBuilder()
        .setCustomId(config.modalId)
        .setTitle(config.title);

    const linkInput = new TextInputBuilder()
        .setCustomId('truemoney_link')
        .setLabel('วางลิงก์ซองอั่งเปา TrueMoney ที่นี่')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://gift.truemoney.com/campaign/?v=...')
        .setMaxLength(300)
        .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(linkInput));
    return modal;
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // ─── กดปุ่มตัวละคร → เปิดฟอร์มซองอั่งเปา TrueMoney ───
        if (interaction.isButton()) {
            const directConfig = ROLE_CONFIG[interaction.customId];
            if (directConfig) {
                return await interaction.showModal(buildTrueMoneyModal(directConfig));
            }

            if (interaction.customId.startsWith(TRUE_MONEY_BUTTON_PREFIX)) {
                const configKey = interaction.customId.slice(TRUE_MONEY_BUTTON_PREFIX.length);
                const config = ROLE_CONFIG[configKey];
                if (!config) return;
                return await interaction.showModal(buildTrueMoneyModal(config));
            }

            return;
        }

        // ─── กรอก Modal → ประมวลผล ───
        if (!interaction.isModalSubmit()) return;
        const discordIdentity = formatDiscordIdentity(interaction.user);

        const config = MODAL_TO_CONFIG[interaction.customId];
        if (!config) return;

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const phoneNumber = process.env.PHONE_NUMBER;
        if (!/^0\d{9}$/.test(phoneNumber ?? '')) {
            await interaction.editReply('❌ ระบบรับเงินยังตั้งค่าไม่ครบ ระบบยังไม่ได้รับเงิน กรุณาแจ้งแอดมินครับ');
            await sendLog(interaction.client, `🔴 **[Config Error]** PHONE_NUMBER ไม่ถูกต้อง`);
            return;
        }

        const voucherHash = parseTrueMoneyLink(interaction.fields.getTextInputValue('truemoney_link'));
        if (!voucherHash) {
            await interaction.editReply('❌ ลิงก์ไม่ถูกต้องครับ กรุณาใช้ลิงก์ซองอั่งเปา TrueMoney เท่านั้น');
            return;
        }

        const slot = acquirePaymentSlot(interaction.user.id, voucherHash);
        if (!slot.ok) {
            const messages = {
                user_busy: '⏳ ระบบกำลังตรวจซองก่อนหน้าของคุณอยู่ กรุณารอให้เสร็จก่อนครับ',
                voucher_busy: '⏳ ซองนี้กำลังถูกตรวจสอบอยู่ กรุณารอสักครู่ครับ',
                system_busy: '⏳ มีผู้ใช้กำลังรับซองอยู่ กรุณาลองใหม่อีกครั้งในไม่ช้าครับ',
                cooldown: `⏳ กรุณารออีกประมาณ **${slot.retryAfterSeconds} วินาที** แล้วลองใหม่ครับ`,
            };
            await interaction.editReply(messages[slot.reason]);
            return;
        }

        const fingerprint = voucherFingerprint(voucherHash);
        const requiredSatang = config.amount * 100;
        const auditBase = {
            voucherFingerprint: fingerprint,
            discordUserId: interaction.user.id,
            discordTag: interaction.user.tag,
            guildId: interaction.guildId,
            roleId: config.roleId,
            roleName: config.roleName,
        };
        let browser;
        let paymentPhase = 'before_redeem';

        try {
            // ตรวจว่ามอบยศได้จริงก่อนเริ่มตรวจและรับเงิน
            const fulfillment = await getFulfillmentTarget(interaction, config);
            if (!fulfillment.ok) {
                await interaction.editReply(fulfillment.message);
                return;
            }

            browser = await chromium.launch({ headless: true, timeout: TRUE_MONEY_REQUEST_TIMEOUT_MS });
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            });
            const page = await context.newPage();
            page.setDefaultTimeout(TRUE_MONEY_REQUEST_TIMEOUT_MS);
            page.setDefaultNavigationTimeout(TRUE_MONEY_REQUEST_TIMEOUT_MS);
            await page.goto(`https://gift.truemoney.com/campaign/?v=${voucherHash}`, {
                waitUntil: 'networkidle',
                timeout: TRUE_MONEY_REQUEST_TIMEOUT_MS,
            });

            const verifyResponse = await fetchJsonInsidePage(
                page,
                `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/verify?mobile=${encodeURIComponent(phoneNumber)}`,
            );
            if (!verifyResponse.body) {
                throw new Error(`TrueMoney verify response ไม่ถูกต้อง (HTTP ${verifyResponse.httpStatus})`);
            }

            const verified = inspectVerifiedVoucher(verifyResponse.body, requiredSatang);
            if (!verified.ok) {
                const verifyMessages = {
                    VOUCHER_OUT_OF_STOCK: '❌ ซองอั่งเปานี้ถูกรับไปแล้ว หรือไม่มีเงินเหลืออยู่ครับ',
                    VOUCHER_EXPIRED: '❌ ซองอั่งเปานี้หมดอายุแล้วครับ',
                };

                if (verified.step === 'verify_failed') {
                    await interaction.editReply(verifyMessages[verified.code] ?? `❌ ไม่สามารถตรวจสอบซองได้ (รหัส: ${verified.code})`);
                } else if (verified.step === 'multi_recipient') {
                    await interaction.editReply('❌ ระบบรับเฉพาะซองแบบ **ส่งให้คนเดียว** เท่านั้นครับ\n*บอทยังไม่ได้ดึงเงิน กรุณาสร้างซองใหม่แบบคนเดียวครับ*');
                } else if (verified.step === 'cannot_verify_recipient_count') {
                    await interaction.editReply('❌ ระบบไม่สามารถยืนยันได้ว่าเป็นซองคนเดียว จึงยังไม่ได้รับเงิน กรุณาแจ้งแอดมินครับ');
                } else if (verified.step === 'cannot_read_amount') {
                    await interaction.editReply('❌ ไม่สามารถอ่านยอดเงินจากซองได้ ระบบยังไม่ได้รับเงิน กรุณาแจ้งแอดมินครับ');
                } else if (verified.step === 'insufficient') {
                    const amount = formatSatang(verified.amountSatang);
                    await interaction.editReply(`❌ **ยอดเงินไม่พอครับ!**\nซองนี้มีเงิน **${amount} บาท** (ขั้นต่ำสำหรับ ${config.roleName} คือ ${config.amount} บาท)\n*บอทยังไม่ได้ดึงเงิน ลิงก์ซองนี้ยังใช้งานได้ปกติครับ*`);
                }

                await sendLog(interaction.client, `🟡 **[ไม่ได้รับเงิน]** ${discordIdentity} → ${verified.step}${verified.code ? ` (${verified.code})` : ''}`);
                return;
            }

            paymentPhase = 'redeem_started';
            await recordTransactionAudit({
                ...auditBase,
                status: 'redeem_started',
                verifiedAmountSatang: verified.amountSatang,
            });

            const redeemResponse = await fetchJsonInsidePage(
                page,
                `https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile: phoneNumber, voucher_hash: voucherHash }),
                },
            );
            if (!redeemResponse.body) {
                throw new Error(`TrueMoney redeem response ไม่ถูกต้อง (HTTP ${redeemResponse.httpStatus})`);
            }

            const redeemed = inspectRedeemedVoucher(redeemResponse.body, verified.amountSatang, requiredSatang);
            if (!redeemed.ok) {
                if (redeemed.step === 'redeemed_below_minimum') {
                    paymentPhase = 'redeemed_amount_mismatch';
                    const amount = formatSatang(redeemed.amountSatang);
                    await recordTransactionAudit({ ...auditBase, status: paymentPhase, actualAmountSatang: redeemed.amountSatang });
                    await interaction.editReply(`⚠️ ระบบรับเงินได้ **${amount} บาท** ซึ่งต่ำกว่าราคา กรุณาติดต่อแอดมินพร้อม User ID **${interaction.user.id}** ครับ`);
                    await sendLog(interaction.client, `🔴 **[CRITICAL: ยอดรับจริงไม่ตรง]** ${discordIdentity} รับ ${amount} บาท ต้องการ ${config.amount} บาท`);
                    return;
                }

                paymentPhase = 'redeem_failed';
                let errorMessage = `❌ ดึงเงินไม่สำเร็จ (รหัส: ${redeemed.code})`;
                if (redeemed.code === 'CANNOT_GET_OWN_VOUCHER') {
                    errorMessage = '❌ รับไม่ได้เพราะเป็นซองที่สร้างจาก Wallet ของผู้รับเองครับ';
                }
                await recordTransactionAudit({ ...auditBase, status: paymentPhase, redeemCode: redeemed.code });
                await interaction.editReply(errorMessage);
                await sendLog(interaction.client, `🔴 **[ดึงเงินล้มเหลว]** ${discordIdentity} → ${redeemed.code}`);
                return;
            }

            paymentPhase = 'redeemed';
            await recordTransactionAudit({
                ...auditBase,
                status: paymentPhase,
                actualAmountSatang: redeemed.amountSatang,
                amountSource: redeemed.amountSource,
            });

            const amount = formatSatang(redeemed.amountSatang);
            try {
                await fulfillment.member.roles.add(fulfillment.role, `TrueMoney donation ${amount} baht`);
            } catch (roleError) {
                paymentPhase = 'role_failed';
                await recordTransactionAudit({
                    ...auditBase,
                    status: paymentPhase,
                    actualAmountSatang: redeemed.amountSatang,
                    error: roleError.message,
                });
                await interaction.editReply(`✅ รับเงินสำเร็จ **${amount} บาท** แล้วครับ!\n❗ แต่ระบบให้ยศไม่ได้ กรุณาติดต่อแอดมินพร้อม User ID **${interaction.user.id}** เพื่อรับยศ **${config.roleName}** ครับ`);
                await sendLog(interaction.client, `🔴 **[ให้ยศล้มเหลว — ตรวจสอบด่วน]**\n${discordIdentity}\nยอด: **${amount} บาท**\nยศ: **${config.roleName}**\nError: \`${roleError.message}\``);
                return;
            }

            paymentPhase = 'role_granted';
            await recordTransactionAudit({
                ...auditBase,
                status: paymentPhase,
                actualAmountSatang: redeemed.amountSatang,
            });
            await interaction.editReply(`✅ รับเงินสำเร็จ **${amount} บาท**!\n🎉 ระบบมอบยศ **${config.roleName}** ให้คุณเรียบร้อยแล้ว ขอบคุณที่สนับสนุนครับ!`);
            await sendLog(interaction.client, `🟢 **[โดเนทสำเร็จ]** ${discordIdentity} โดเนท **${amount} บาท** → ได้รับยศ **${config.roleName}**`);
        } catch (error) {
            console.error('[ERROR] interactionCreate:', error);
            const isAmbiguousPayment = paymentPhase === 'redeem_started';
            const moneyWasRedeemed = ['redeemed', 'redeemed_amount_mismatch', 'role_failed', 'role_granted'].includes(paymentPhase);
            const auditStatus = isAmbiguousPayment
                ? 'redeem_unknown'
                : moneyWasRedeemed
                    ? 'post_redeem_error'
                    : 'system_error';
            await recordTransactionAudit({ ...auditBase, status: auditStatus, paymentPhase, error: error.message });

            if (isAmbiguousPayment) {
                await interaction.editReply('⚠️ ระบบขาดการติดต่อระหว่างรับซอง ห้ามส่งซองเดิมซ้ำ กรุณาติดต่อแอดมินพร้อม User ID **' + interaction.user.id + '** ครับ').catch(() => {});
                await sendLog(interaction.client, `🔴 **[CRITICAL: สถานะรับเงินไม่ชัดเจน]** ${discordIdentity} Error: \`${error.message}\``);
            } else if (moneyWasRedeemed) {
                await interaction.editReply('⚠️ ระบบรับเงินแล้วแต่เกิดข้อผิดพลาดภายหลัง กรุณาติดต่อแอดมินพร้อม User ID **' + interaction.user.id + '** ครับ').catch(() => {});
                await sendLog(interaction.client, `🔴 **[Post-redeem Error]** ${discordIdentity} Phase: \`${paymentPhase}\` Error: \`${error.message}\``);
            } else {
                await interaction.editReply('❌ เกิดข้อผิดพลาดระหว่างตรวจซอง ระบบยังไม่ได้รับเงิน กรุณาลองใหม่ครับ').catch(() => {});
                await sendLog(interaction.client, `🔴 **[System Error — ยังไม่ได้รับเงิน]** ${discordIdentity} Error: \`${error.message}\``);
            }
        } finally {
            if (browser) await browser.close().catch(() => {});
            releasePaymentSlot(interaction.user.id, voucherHash);
        }
    },
    _internals: {
        ROLE_CONFIG,
        parseTrueMoneyLink,
        parseBahtToSatang,
        readRecipientCount,
        inspectVerifiedVoucher,
        inspectRedeemedVoucher,
        acquirePaymentSlot,
        releasePaymentSlot,
        resetPaymentStateForTests() {
            activeUsers.clear();
            activeVouchers.clear();
            userCooldowns.clear();
            activePaymentCount = 0;
        },
    },
};
