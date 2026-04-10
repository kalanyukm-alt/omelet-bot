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
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1492088451045265528/TA-2026-03-31-08-33-28-1girlbeau-2853828639-1.png?ex=69da0f28&is=69d8bda8&hm=68285cc3693cca4978eec2e1e7c5686c2eda5d10122b28c6ef25f033050e0579&');

            const yuriButton = new ButtonBuilder().setCustomId('buy_yuri').setLabel('🎀 โดเนทให้ ยูริ (12 บาท)').setStyle(ButtonStyle.Primary);
            const yuriRow = new ActionRowBuilder().addComponents(yuriButton);
            await message.channel.send({ embeds: [yuriEmbed], components: [yuriRow] });

            // --- ก้อนที่ 2: ของเซนะ (10 บาท) ---
            const senaEmbed = new EmbedBuilder()
                .setColor('#ffbaba')
                .setTitle('🌸 ตัวละคร: เซนะ (Sena)')
                .setDescription('ได้รับยศพิเศษ <@&1489705449094643872>')
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1492088519496171641/TA-2026-04-01-16-33-12-1girlbeau-3059653170.png?ex=69da0f38&is=69d8bdb8&hm=57cac0b102d018d498066757eac03e30a36116d121ea63459c5f8e1fbac97e19&=&format=webp&quality=lossless&width=960&height=960');

            const senaButton = new ButtonBuilder().setCustomId('buy_sena').setLabel('🌸 โดเนทให้ เซนะ (10 บาท)').setStyle(ButtonStyle.Success);
            const senaRow = new ActionRowBuilder().addComponents(senaButton);
            await message.channel.send({ embeds: [senaEmbed], components: [senaRow] });

            // --- ก้อนที่ 3: ของมิเรย์ (20 บาท) ---
            const mireiEmbed = new EmbedBuilder()
                .setColor('#9b59b6') 
                .setTitle('💜 ตัวละคร: มิเรย์ (Mirei)')
                .setDescription('ได้รับยศพิเศษ <@&1490129026990473386>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1492088560193503303/TA-2026-04-03-18-10-00-1FemaleBe-1722839310-0.png?ex=69da0f42&is=69d8bdc2&hm=ec42591b890a7ba2855ac1746ca7047e555a4af678694c160b64b423cc6e5e17&=&format=webp&quality=lossless&width=960&height=960');

            const mireiButton = new ButtonBuilder().setCustomId('buy_mirei').setLabel('💜 โดเนทให้ มิเรย์ (20 บาท)').setStyle(ButtonStyle.Secondary); 
            const mireiRow = new ActionRowBuilder().addComponents(mireiButton);
            await message.channel.send({ embeds: [mireiEmbed], components: [mireiRow] });

            // --- ก้อนที่ 4: ลลิน (15 บาท) ---
            const lalinEmbed = new EmbedBuilder()
                .setColor('#88bcff') 
                .setTitle('🩵 ตัวละคร: ลลิน (Lalin)')
                .setDescription('ได้รับยศพิเศษ <@&1492199679977586752>') 
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1492200155812859955/TA-2026-04-08-15-37-29-1girlslim-2809290180-1.png?ex=69da7730&is=69d925b0&hm=a697217f8438fcc3be60e938536f5366707faa36dcbbe2643dc6d45e694f2230&');

            const lalinButton = new ButtonBuilder().setCustomId('buy_lalin').setLabel('🩵 โดเนทให้ ลลิน (15 บาท)').setStyle(ButtonStyle.Secondary);
            const lalinRow = new ActionRowBuilder().addComponents(lalinButton);
            await message.channel.send({ embeds: [lalinEmbed], components: [lalinRow] });

            await message.delete();
        }
    },
};