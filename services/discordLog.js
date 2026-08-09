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

module.exports = { sendLog };
