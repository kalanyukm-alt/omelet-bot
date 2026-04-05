module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ สำเร็จ! บอท ${client.user.tag} ออนไลน์พร้อมทำงานด้วยระบบแยกไฟล์แล้ว!`);
    },
};