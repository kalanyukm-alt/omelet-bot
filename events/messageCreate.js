const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // ป้องกันไม่ให้บอทคุยกันเอง
        if (message.author.bot) return;

        // 🚨 --- ระบบยามรักษาความปลอดภัย: ดักจับการ Forward --- 🚨
        const isForwarded = message.flags.has(1 << 14) || (message.messageSnapshots && message.messageSnapshots.size > 0) || message.reference?.type === 2;

        if (isForwarded) {
            await message.delete().catch(err => console.log('ลบข้อความไม่ได้:', err));
            const warningMsg = await message.channel.send(`🚫 <@${message.author.id}> **ไม่อนุญาตให้ Forward ข้อความเข้ามาในห้องนี้นะครับ!**`);
            setTimeout(() => {
                warningMsg.delete().catch(() => {});
            }, 5000);
            return; 
        }
        // ----------------------------------------------------

        if (message.content === '!up') {
            
            // --- ก้อนที่ 1: ของยูริ (12 บาท) ---
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
                .setDescription('ได้รับยศพิเศษ <@&1493224189841117278>') 
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

            // --- 🎀 ก้อนที่ 5: ยูริ M4 (15 บาท) ---
            const yurim4Embed = new EmbedBuilder()
                .setColor('#ff4da6') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🎀 ตัวละคร: ยูริ (Yuri) M4')
                .setDescription('ได้รับยศพิเศษ <@&1492549297617502279>') 
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1492550342766891089/TA-2026-04-11-07-04-05-1girlbeau-2666881247-0.png?ex=69dbbd53&is=69da6bd3&hm=ffba4fa399a8520aee9773ef2fd3849e5737c2d69b6c988a65b62645f53f84d0&');

            const yurim4Button = new ButtonBuilder().setCustomId('buy_yurim4').setLabel('🎀 โดเนทให้ ยูริ M4 (15 บาท)').setStyle(ButtonStyle.Danger); // ใช้ปุ่มสีแดง (Danger)
            const yurim4Row = new ActionRowBuilder().addComponents(yurim4Button);
            await message.channel.send({ embeds: [yurim4Embed], components: [yurim4Row] });

            // --- 🍇 ก้อนที่ 6: มิเรย์ (Mirei) - ประธานนักเรียน (15 บาท) ---
            const mireiPresidentEmbed = new EmbedBuilder()
                .setColor('#de70ff') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🍇 ตัวละคร: มิเรย์ (Mirei) - ประธานนักเรียน')
                .setDescription('ได้รับยศพิเศษ <@&1493215773663952906>') 
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1493216667973455943/TA-2026-04-12-21-50-45-1girlbeau-2767750067.png?ex=69de29e4&is=69dcd864&hm=d0d648a94790596f2202808ad1b0c3c103218823eeaf6a79e8d9d2f10c7bda86&');

            const mireiPresidentButton = new ButtonBuilder().setCustomId('buy_mirei_president').setLabel('🍇 โดเนทให้ มิเรย์ - ประธานนักเรียน (15 บาท)').setStyle(ButtonStyle.Danger);
            const mireiPresidentRow = new ActionRowBuilder().addComponents(mireiPresidentButton);
            await message.channel.send({ embeds: [mireiPresidentEmbed], components: [mireiPresidentRow] });

             // --- 🧁 ก้อนที่ 6: โมโมกะ (Momoka) (14 บาท) ---
            const momokaEmbed = new EmbedBuilder()
                .setColor('#ffc6c6') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🧁 ตัวละคร: โมโมกะ (Momoka)')
                .setDescription('ได้รับยศพิเศษ <@&1493670409110028469>') 
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1493671258523439414/TA-2026-04-14-06-15-48-upperbody-3483496300-0.png?ex=69dfd143&is=69de7fc3&hm=4afdfa1ba806b24c61c9f6cac18919ee511ab353dc7d224bf899291b502f7c4a&');

            const momokaButton = new ButtonBuilder().setCustomId('buy_momoka').setLabel('🧁 โดเนทให้ โมโมกะ (14 บาท)').setStyle(ButtonStyle.Primary);
            const momokaRow = new ActionRowBuilder().addComponents(momokaButton);
            await message.channel.send({ embeds: [momokaEmbed], components: [momokaRow] });

            // --- 🌸 ก้อนที่ 7: เมล (Melle) (14 บาท) ---
            const melleEmbed = new EmbedBuilder()
                .setColor('#ff9e9e') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🌸 ตัวละคร: เมล (Melle)')
                .setDescription('ได้รับยศพิเศษ <@&1494326775314911242>') 
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1494327692630163497/TA-2026-04-13-07-25-26-upperbody-885983960.png?ex=69e2349d&is=69e0e31d&hm=9e989d13bbc3cf97a7f9a4bb224a2f211df5b8719d83d9a5e08c5c48fd540a7f&');

            const melleButton = new ButtonBuilder().setCustomId('buy_melle').setLabel('🌸 โดเนทให้ เมล (14 บาท)').setStyle(ButtonStyle.Primary);
            const melleRow = new ActionRowBuilder().addComponents(melleButton);
            await message.channel.send({ embeds: [melleEmbed], components: [melleRow] });

            // --- ♣️ ก้อนที่ 8: นิลยา (Nillaya) (10 บาท) ---
            const nillayaEmbed = new EmbedBuilder()
                .setColor('#ff9e9e') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('♣️ ตัวละคร: นิลยา (Nillaya)')
                .setDescription('ได้รับยศพิเศษ <@&1495476449275023552>') 
                .setImage('https://cdn.discordapp.com/attachments/1489853742462533762/1495477001736294491/TA-2026-04-13-17-33-48-upperbody-1610254243-0.png?ex=69e662fd&is=69e5117d&hm=8197c6c666351d53f8e4ebdd74da5bfc7ecc2e0629cbe1ebbcfa3625d7ac6caf&');

            const nillayaButton = new ButtonBuilder().setCustomId('buy_nillaya').setLabel('♣️ โดเนทให้ นิลยา (10 บาท)').setStyle(ButtonStyle.Primary);
            const nillayaRow = new ActionRowBuilder().addComponents(nillayaButton);
            await message.channel.send({ embeds: [nillayaEmbed], components: [nillayaRow] });

            await message.delete();
        }
    },
};