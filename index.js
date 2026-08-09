require('dotenv').config();
const express = require('express');
const fs = require('fs'); // เพิ่มเครื่องมืออ่านไฟล์
const path = require('path'); // เพิ่มเครื่องมือจัดการที่อยู่ไฟล์
const { Client, GatewayIntentBits } = require('discord.js');
const { createStripeWebhookHandler, getStripeStatus } = require('./services/stripePayments');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// ---------------------------------------------------------
// ระบบอ่านไฟล์อัตโนมัติ (Event Handler)
// ---------------------------------------------------------
// 1. ชี้เป้าไปที่โฟลเดอร์ events
const eventsPath = path.join(__dirname, 'events');

// 2. กวาดตามองหาไฟล์ทั้งหมดที่ลงท้ายด้วย .js
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
let roleConfigByKey = {};

// 3. สั่งให้บอทดึงไฟล์เหล่านั้นมาเปิดใช้งานทีละไฟล์
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event._internals?.ROLE_CONFIG) roleConfigByKey = event._internals.ROLE_CONFIG;
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const app = express();

// Stripe ต้องได้รับ raw body เพื่อยืนยันลายเซ็น ห้ามวาง express.json() ก่อน route นี้
app.post(
    '/stripe/webhook',
    express.raw({ type: 'application/json', limit: '256kb' }),
    createStripeWebhookHandler({ client, roleConfigByKey }),
);

app.get('/stripe/success', (req, res) => {
    res
        .set('Cache-Control', 'no-store')
        .type('html')
        .send('<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ชำระเงินสำเร็จ</title><body style="font-family:system-ui;max-width:680px;margin:15vh auto;padding:24px;text-align:center"><h1>ชำระเงินสำเร็จ ✅</h1><p>กลับไปที่ Discord ได้เลย ระบบจะมอบยศหลังได้รับการยืนยันจาก Stripe</p></body></html>');
});

app.get('/stripe/cancel', (req, res) => {
    res
        .set('Cache-Control', 'no-store')
        .type('html')
        .send('<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ยกเลิกการชำระเงิน</title><body style="font-family:system-ui;max-width:680px;margin:15vh auto;padding:24px;text-align:center"><h1>ยังไม่ได้ชำระเงิน</h1><p>ไม่มีการตัดเงิน คุณสามารถกลับไปสร้างรายการใหม่ใน Discord ได้ครับ</p></body></html>');
});

app.get('/', (req, res) => {
    const stripeStatus = getStripeStatus();
    const stripeLabel = stripeStatus.enabled ? `Stripe ${stripeStatus.mode}` : 'Stripe ยังไม่เปิดใช้';
    res.type('text').send(`บอท Omelet กำลังทำงาน 24 ชั่วโมง! (${stripeLabel})`);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`เซิร์ฟเวอร์เว็บเริ่มทำงานที่พอร์ต ${port}`));

// ล็อกอินบอทด้วย Token
client.login(process.env.TOKEN).catch(error => {
    console.error('[FATAL] ล็อกอิน Discord ไม่สำเร็จ:', error.message);
    process.exitCode = 1;
});
