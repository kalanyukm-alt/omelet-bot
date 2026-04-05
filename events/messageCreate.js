const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // ป้องกันไม่ให้บอทคุยกันเอง
        if (message.author.bot) return;

        // 🚨 --- ระบบยามรักษาความปลอดภัย: ดักจับการ Forward --- 🚨
        // ตรวจสอบว่าข้อความนี้ถูก Forward มาหรือไม่ (เช็คจาก Flag และ Snapshot)
        const isForwarded = message.flags.has(1 << 14) || (message.messageSnapshots && message.messageSnapshots.size > 0) || message.reference?.type === 2;

        if (isForwarded) {
            // สั่งลบข้อความที่ Forward มาทิ้งทันที
            await message.delete().catch(err => console.log('ลบข้อความไม่ได้:', err));
            
            // ให้บอทเด้งด่า/เตือนคนส่ง
            const warningMsg = await message.channel.send(`🚫 <@${message.author.id}> **ไม่อนุญาตให้ Forward ข้อความเข้ามาในห้องนี้นะครับ!**`);
            
            // ลบคำเตือนทิ้งภายใน 5 วินาที เพื่อไม่ให้ห้องรก
            setTimeout(() => {
                warningMsg.delete().catch(() => {});
            }, 5000);
            
            return; // จบการทำงานของโค้ดตรงนี้เลย ไม่ต้องทะลุไปรันโค้ดอื่นต่อ
        }
        // ----------------------------------------------------

        // โค้ดสร้างเมนูเดิมของคุณ
        if (message.content === '!สร้างเมนู') {
            
            // --- ก้อนที่ 1: ของยูริ (10 บาท) ---
            const yuriEmbed = new EmbedBuilder()
                .setColor('#356bff')
                .setTitle('🎀 ตัวละคร: ยูริ (Yuri)')
                .setDescription('ได้รับยศพิเศษ <@&1489704389198217367>')
                .setImage('https://media.discordapp.net/attachments/1489703909256859672/1489855393386729573/TA-2026-03-31-08-30-23-1girlbeau-2585471507.png?ex=69d1ef75&is=69d09df5&hm=ba0d62936e64e99e0c0003e81f07b5e7cec48650930a0cd4d46084aed02af9b2&=&format=webp&quality=lossless&width=960&height=960');

            const yuriButton = new ButtonBuilder().setCustomId('buy_yuri').setLabel('🎀 โดเนทให้ ยูริ (12 บาท)').setStyle(ButtonStyle.Primary);
            const yuriRow = new ActionRowBuilder().addComponents(yuriButton);
            await message.channel.send({ embeds: [yuriEmbed], components: [yuriRow] });

            // --- ก้อนที่ 2: ของเซนะ (10 บาท) ---
            const senaEmbed = new EmbedBuilder()
                .setColor('#ffbaba')
                .setTitle('🌸 ตัวละคร: เซนะ (Sena)')
                .setDescription('ได้รับยศพิเศษ <@&1489705449094643872>')
                .setImage('https://media.discordapp.net/attachments/1489703909256859672/1489855429994610889/TA-2026-04-01-16-33-12-1girlbeau-3059653170.png?ex=69d1ef7e&is=69d09dfe&hm=b70d69f1d0cda1eea867e28e9414ad26c8923003f5e2cc2c9e6f0cdd329d113c&=&format=webp&quality=lossless&width=960&height=960');

            const senaButton = new ButtonBuilder().setCustomId('buy_sena').setLabel('🌸 โดเนทให้ เซนะ (10 บาท)').setStyle(ButtonStyle.Success);
            const senaRow = new ActionRowBuilder().addComponents(senaButton);
            await message.channel.send({ embeds: [senaEmbed], components: [senaRow] });

            // --- ก้อนที่ 3: ของมิเรย์ (20 บาท) ---
            const mireiEmbed = new EmbedBuilder()
                .setColor('#9b59b6') 
                .setTitle('💜 ตัวละคร: มิเรย์ (Mirei)')
                .setDescription('ได้รับยศพิเศษ <@&1490129026990473386>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1490131800092184737/TA-2026-04-03-18-10-00-1FemaleBe-1722839310-0.png?ex=69d2f0e2&is=69d19f62&hm=877cd2199266e65f6a7b4788b922513d730f377056c88c2a882640bb023d10ec&=&format=webp&quality=lossless&width=960&height=960');

            const mireiButton = new ButtonBuilder().setCustomId('buy_mirei').setLabel('💜 โดเนทให้ มิเรย์ (20 บาท)').setStyle(ButtonStyle.Secondary); 
            const mireiRow = new ActionRowBuilder().addComponents(mireiButton);
            await message.channel.send({ embeds: [mireiEmbed], components: [mireiRow] });
          
            await message.delete();
        }
    },
};