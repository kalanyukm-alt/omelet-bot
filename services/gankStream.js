const WebSocket = require('ws');

const STREAM_USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseStreamUserId(streamUrl) {
    try {
        const url = new URL(streamUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (
            url.protocol !== 'https:'
            || url.hostname !== 'stream.ganknow.com'
            || pathParts.length !== 1
            || !STREAM_USER_ID_PATTERN.test(pathParts[0])
        ) {
            return null;
        }
        return pathParts[0];
    } catch {
        return null;
    }
}

function toMessageText(data) {
    if (typeof data === 'string') return Promise.resolve(data);
    if (data instanceof ArrayBuffer) return Promise.resolve(Buffer.from(data).toString('utf8'));
    if (ArrayBuffer.isView(data)) {
        return Promise.resolve(Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('utf8'));
    }
    if (data && typeof data.text === 'function') return data.text();
    return Promise.resolve(String(data ?? ''));
}

function startGankStream({ streamUrl, onMessage, logger = console, WebSocketImpl = WebSocket }) {
    const streamUserId = parseStreamUserId(streamUrl);
    if (!streamUserId) throw new Error('GANK_STREAM_URL ไม่ถูกต้อง');
    if (typeof WebSocketImpl !== 'function') throw new Error('Node.js รุ่นนี้ไม่รองรับ WebSocket');

    let socket;
    let reconnectTimer;
    let stopped = false;
    let reconnectAttempt = 0;
    let messageQueue = Promise.resolve();

    const socketUrl = `wss://api.ganknow.com/v1/ws/users/media-share?page=alert-and-tts&source=streaming&user_id=${encodeURIComponent(streamUserId)}`;

    function scheduleReconnect() {
        if (stopped || reconnectTimer) return;
        reconnectAttempt += 1;
        const delayMs = Math.min(30_000, 1_000 * (2 ** Math.min(reconnectAttempt - 1, 5)));
        logger.warn(`[GANK] การเชื่อมต่อปิดลง กำลังเชื่อมใหม่ใน ${Math.ceil(delayMs / 1000)} วินาที`);
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
        }, delayMs);
        reconnectTimer.unref?.();
    }

    function connect() {
        if (stopped) return;
        socket = new WebSocketImpl(socketUrl);

        socket.addEventListener('open', () => {
            reconnectAttempt = 0;
            logger.log('[GANK] เชื่อมต่อ Stream Alert แล้ว');
        });

        socket.addEventListener('message', event => {
            messageQueue = messageQueue
                .then(async () => onMessage(await toMessageText(event.data)))
                .catch(error => logger.error('[GANK] ประมวลผล Stream Alert ไม่สำเร็จ:', error));
        });

        socket.addEventListener('error', () => {
            logger.error('[GANK] WebSocket เกิดข้อผิดพลาด');
        });

        socket.addEventListener('close', scheduleReconnect);
    }

    connect();

    return function stop() {
        stopped = true;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = null;
        if (socket && (socket.readyState === WebSocketImpl.OPEN || socket.readyState === WebSocketImpl.CONNECTING)) {
            socket.close(1000, 'Bot shutting down');
        }
    };
}

module.exports = { parseStreamUserId, startGankStream };
