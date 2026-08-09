const fs = require('node:fs/promises');
const path = require('node:path');

async function writeTransactionAudit(record) {
    const auditDirectory = path.join(__dirname, '..', 'data');
    const auditPath = path.join(auditDirectory, 'transactions.jsonl');
    await fs.mkdir(auditDirectory, { recursive: true });
    await fs.appendFile(
        auditPath,
        `${JSON.stringify({ at: new Date().toISOString(), ...record })}\n`,
        'utf8',
    );
}

async function recordTransactionAudit(record) {
    try {
        await writeTransactionAudit(record);
    } catch (error) {
        console.error('[WARN] เขียน transaction audit ลงไฟล์ไม่สำเร็จ:', error.message);
    }
}

module.exports = {
    recordTransactionAudit,
    _internals: { writeTransactionAudit },
};
