const test = require('node:test');
const assert = require('node:assert/strict');

const { formatDiscordIdentity } = require('../services/discordLog');

test('แสดงชื่อ Discord ควบคู่ User ID ใน transaction log', () => {
    assert.equal(
        formatDiscordIdentity({ id: '123456789012345678', tag: 'omelet.user' }),
        'ชื่อ Discord: `omelet.user` | User ID: `123456789012345678`',
    );
});

test('ชื่อ Discord ไม่สามารถแทรกบรรทัดหรือปิด inline code ของ log ได้', () => {
    const identity = formatDiscordIdentity({ id: '123', tag: 'bad`name\n@everyone' });
    assert.equal(identity, 'ชื่อ Discord: `badˋname @everyone` | User ID: `123`');
    assert.equal(identity.includes('\n'), false);
});
