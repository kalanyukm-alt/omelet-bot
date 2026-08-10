function sanitizeInlineCode(value, fallback) {
    const normalized = String(value ?? fallback)
        .replace(/[\r\n]+/g, ' ')
        .replace(/`/g, 'ˋ')
        .trim();
    return normalized || fallback;
}

function formatDiscordIdentity(user, fallbackId = 'unknown') {
    const discordUser = user?.user ?? user;
    const tag = sanitizeInlineCode(discordUser?.tag ?? discordUser?.username, 'ไม่ทราบชื่อ');
    const userId = sanitizeInlineCode(discordUser?.id ?? fallbackId, 'unknown');
    return `ชื่อ Discord: \`${tag}\` | User ID: \`${userId}\``;
}

async function sendLog(client, content) {
    try {
        const channelId = process.env.LOG_CHANNEL;
        if (!channelId) return;

        const channel = client.channels.cache.get(channelId) ?? await client.channels.fetch(channelId);
        if (channel?.isTextBased()) {
            await channel.send({ content, allowedMentions: { parse: [] } });
        }
    } catch (error) {
        console.error('[WARN] ส่ง transaction log ไป Discord ไม่สำเร็จ:', error.message);
    }
}

module.exports = { formatDiscordIdentity, sendLog };
