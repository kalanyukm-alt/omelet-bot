const path = require('node:path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { createOrderManager, parseGankAlert } = require('./gankPayments');
const { parseStreamUserId, startGankStream } = require('./gankStream');
const { formatDiscordIdentity, sendLog } = require('./discordLog');

const DEFAULT_TIP_URL = 'https://ganknow.com/omelettt1101/tip';
const orderManager = createOrderManager({
    storagePath: process.env.GANK_ORDER_STORE_PATH
        ? path.resolve(process.env.GANK_ORDER_STORE_PATH)
        : undefined,
});

function formatSatang(satang) {
    return (satang / 100).toLocaleString('th-TH', {
        minimumFractionDigits: satang % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
    });
}

function getTipUrl() {
    const configured = process.env.GANK_TIP_URL || DEFAULT_TIP_URL;
    try {
        const url = new URL(configured);
        if (url.protocol !== 'https:' || url.hostname !== 'ganknow.com' || !url.pathname.endsWith('/tip')) {
            throw new Error();
        }
        return url.toString();
    } catch {
        throw new Error('GANK_TIP_URL ไม่ถูกต้อง');
    }
}

async function createPendingGankOrder(interaction, configKey, config) {
    if (!parseStreamUserId(process.env.GANK_STREAM_URL)) {
        return {
            flags: MessageFlags.Ephemeral,
            content: '❌ ระบบรับเงิน Gank ยังไม่ได้ตั้งค่า จึงยังไม่เปิดรับชำระเงิน กรุณาแจ้งแอดมินครับ',
            components: [],
        };
    }

    const { order, reused } = await orderManager.createOrder({
        discordUserId: interaction.user.id,
        discordTag: interaction.user.tag ?? interaction.user.username,
        guildId: interaction.guildId,
        configKey,
        roleId: config.roleId,
        roleName: config.roleName,
        requiredSatang: config.amount * 100,
    });

    const paymentButton = new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel('เปิดหน้าจ่ายเงิน Gank')
        .setURL(getTipUrl());
    const row = new ActionRowBuilder().addComponents(paymentButton);
    const amount = formatSatang(order.requiredSatang);
    const reusedNote = reused ? '\n*ระบบใช้รายการเดิมที่ยังไม่หมดอายุให้ครับ*' : '';

    return {
        flags: MessageFlags.Ephemeral,
        content: [
            `💳 **ชำระเพื่อรับยศ ${order.roleName} — ${amount} บาท**`,
            `รหัสของคุณ: **\`${order.code}\`**`,
            '',
            `1. กดปุ่มด้านล่างและกรอกยอด **${amount} บาท**`,
            `2. ใส่ **${order.code}** ในช่อง **“ข้อความของคุณ”** ให้ตรงทุกตัว`,
            '3. ชำระเงินแล้วรอสักครู่ บอตจะมอบยศและเปิดห้องให้อัตโนมัติ',
            '',
            '⚠️ หากไม่ใส่รหัสหรือใส่ผิด ระบบจะไม่รู้ว่าเงินเป็นของบัญชี Discord ไหน',
            reusedNote,
        ].filter(Boolean).join('\n'),
        components: [row],
    };
}

async function notifyUser(client, userId, content) {
    try {
        const user = await client.users.fetch(userId);
        await user.send(content);
    } catch {
        // ผู้ใช้อาจปิด DM ไว้ การมอบยศและ transaction log ยังทำงานต่อได้
    }
}

async function grantOrderRole(client, order) {
    const guild = await client.guilds.fetch(order.guildId);
    const member = await guild.members.fetch(order.discordUserId);
    const role = await guild.roles.fetch(order.roleId);
    const botMember = guild.members.me ?? await guild.members.fetchMe();

    if (!role) throw new Error(`ไม่พบ Role ${order.roleId}`);
    if (
        role.managed
        || !botMember.permissions.has(PermissionFlagsBits.ManageRoles)
        || botMember.roles.highest.comparePositionTo(role) <= 0
    ) {
        throw new Error(`บอตไม่มีสิทธิ์มอบ Role ${order.roleId}`);
    }

    await member.roles.add(role, `Gank tip order ${order.code}`);
    return member;
}

async function handleGankMessage(client, rawMessage) {
    const alert = parseGankAlert(rawMessage);
    if (!alert.ok) {
        if (alert.reason === 'test_alert') console.log('[GANK] ข้าม Test Alert');
        if (['unsupported_currency', 'invalid_amount'].includes(alert.reason)) {
            await sendLog(client, `🔴 **[Gank Alert อ่านยอดไม่ได้]** เหตุผล: \`${alert.reason}\` Event: \`${alert.eventId ?? 'unknown'}\``);
        }
        return alert;
    }

    const result = await orderManager.applyAlert(alert);
    if (['duplicate_event', 'unknown_code', 'order_not_pending'].includes(result.status)) return result;

    const identity = formatDiscordIdentity({ tag: result.order.discordTag, id: result.order.discordUserId });
    if (result.status === 'expired') {
        await sendLog(client, `🔴 **[Gank รับเงินแต่รหัสหมดอายุ]** ${identity} รหัส: \`${result.order.code}\` Event: \`${alert.eventId}\``);
        await notifyUser(client, result.order.discordUserId, `⚠️ Gank รับรายการแล้ว แต่รหัส **${result.order.code}** หมดอายุ กรุณาติดต่อแอดมินพร้อมรหัสนี้ครับ`);
        return result;
    }

    if (result.status === 'partial') {
        const received = formatSatang(result.order.receivedSatang);
        const remaining = formatSatang(result.order.requiredSatang - result.order.receivedSatang);
        await sendLog(client, `🟡 **[Gank ยอดยังไม่ครบ]** ${identity} รับแล้ว **${received} บาท** เหลือ **${remaining} บาท** รหัส: \`${result.order.code}\``);
        await notifyUser(client, result.order.discordUserId, `⚠️ ยอดสำหรับ **${result.order.roleName}** ยังไม่ครบครับ รับแล้ว **${received} บาท** เหลือ **${remaining} บาท**\nหากจ่ายเพิ่มให้ใช้รหัสเดิม **${result.order.code}**`);
        return result;
    }

    try {
        await grantOrderRole(client, result.order);
        const completed = await orderManager.finishOrder(result.order.code, 'fulfilled', {
            actualAmountSatang: result.order.receivedSatang,
        });
        const amount = formatSatang(completed.receivedSatang);
        await notifyUser(client, completed.discordUserId, `✅ รับทิป **${amount} บาท** สำเร็จ และมอบยศ **${completed.roleName}** ให้แล้วครับ ห้องถูกเปิดให้เรียบร้อย 🎉`);
        await sendLog(client, `🟢 **[Gank สำเร็จ]** ${identity} ทิป **${amount} บาท** → ยศ **${completed.roleName}** รหัส: \`${completed.code}\``);
        return { status: 'fulfilled', order: completed };
    } catch (error) {
        const failed = await orderManager.finishOrder(result.order.code, 'role_failed', { error: error.message });
        await notifyUser(client, failed.discordUserId, `⚠️ รับเงินผ่าน Gank แล้ว แต่บอตมอบยศ **${failed.roleName}** ไม่สำเร็จ กรุณาติดต่อแอดมินพร้อมรหัส **${failed.code}** ครับ`);
        await sendLog(client, `🔴 **[Gank รับเงินแล้วแต่ให้ยศไม่ได้]** ${identity} รหัส: \`${failed.code}\` Error: \`${error.message}\``);
        return { status: 'role_failed', order: failed, error };
    }
}

function startGankIntegration(client) {
    const streamUrl = process.env.GANK_STREAM_URL;
    if (!streamUrl) {
        console.warn('[GANK] ยังไม่ได้ตั้ง GANK_STREAM_URL ระบบรับเงิน Gank ยังไม่เริ่มทำงาน');
        return null;
    }

    try {
        return startGankStream({
            streamUrl,
            onMessage: message => handleGankMessage(client, message),
        });
    } catch (error) {
        console.error('[GANK] เริ่มระบบไม่ได้:', error.message);
        return null;
    }
}

module.exports = {
    createPendingGankOrder,
    handleGankMessage,
    startGankIntegration,
    _internals: { orderManager, getTipUrl, formatSatang, grantOrderRole },
};
