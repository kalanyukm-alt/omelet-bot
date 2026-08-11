require('dotenv').config();
const express = require('express');
const fs = require('fs'); // เพิ่มเครื่องมืออ่านไฟล์
const path = require('path'); // เพิ่มเครื่องมือจัดการที่อยู่ไฟล์
const { Client, GatewayIntentBits } = require('discord.js');

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

// 3. สั่งให้บอทดึงไฟล์เหล่านั้นมาเปิดใช้งานทีละไฟล์
for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const app = express();

app.get('/', (req, res) => {
    res.type('text').send('บอท Omelet กำลังทำงาน 24 ชั่วโมง!');
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`เซิร์ฟเวอร์เว็บเริ่มทำงานที่พอร์ต ${port}`));

// ล็อกอินบอทด้วย Token
client.login(process.env.TOKEN).catch(error => {
    console.error('[FATAL] ล็อกอิน Discord ไม่สำเร็จ:', error.message);
    process.exitCode = 1;
});
