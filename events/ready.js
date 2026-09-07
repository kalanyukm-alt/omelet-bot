const { Events } = require('discord.js');
const { startGankIntegration } = require('../services/gankIntegration');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`✅ สำเร็จ! บอท ${client.user.tag} ออนไลน์พร้อมทำงานด้วยระบบแยกไฟล์แล้ว!`);
        startGankIntegration(client);
    },
};
