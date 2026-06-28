const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageCreate', // 📌 ใช้ชื่อ event เดิม เพื่อให้บอทรู้ว่าต้องดักจับข้อความ
    async execute(message) {
        // ป้องกันไม่ให้บอทคุยกันเอง
        if (message.author.bot) return;

        if (message.content === '!up2') { 
            
             // --- 🍧 ก้อนที่ 1: ฟลอเรนเซีย (Florencia) (10 บาท) ---
            const florenciaEmbed = new EmbedBuilder()
                .setColor('#ff96b9') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🍧 ตัวละคร: ฟลอเรนเซีย (Florencia)')
                .setDescription('ได้รับยศพิเศษ <@&1499107236587245668>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1499107962982109455/TA-2026-04-26-11-03-37-1girlbeau-2561730842.png?ex=69f39896&is=69f24716&hm=5428134eb1cc2856de390c4113c7bc028a14a6fbe998133f96ed5400c8b04cb7&=&format=webp&quality=lossless&width=876&height=876');

            const florenciaButton = new ButtonBuilder().setCustomId('buy_florencia').setLabel('🍧 โดเนทให้ ฟลอเรนเซีย (10 บาท)').setStyle(ButtonStyle.Primary);
            const florenciaRow = new ActionRowBuilder().addComponents(florenciaButton);
            await message.channel.send({ embeds: [florenciaEmbed], components: [florenciaRow] });

             // --- 🧸 ก้อนที่ 2: ลูเม (Lume) (10 บาท) ---
            const lumeEmbed = new EmbedBuilder()
                .setColor('#ffc6d9') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🧸 ตัวละคร: ลูเม (Lume)')
                .setDescription('ได้รับยศพิเศษ <@&1499995613649961000>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1499995233046237204/TA-2026-04-27-23-13-18-1girlbeau-2988740193.png?ex=69f6d2ec&is=69f5816c&hm=834af93548aedfe588ced62206e99d51a269b854655ffbd7b46af5453753bf14&=&format=webp&quality=lossless&width=876&height=876');

            const lumeButton = new ButtonBuilder().setCustomId('buy_lume').setLabel('🧸 โดเนทให้ ลูเม (10 บาท)').setStyle(ButtonStyle.Primary);
            const lumeRow = new ActionRowBuilder().addComponents(lumeButton);
            await message.channel.send({ embeds: [lumeEmbed], components: [lumeRow] });

             // --- 🐕 ก้อนที่ 3: อาร์คาเนีย (Arcania) (10 บาท) ---
            const arcaniaEmbed = new EmbedBuilder()
                .setColor('#886262')
                .setTitle('🐕 ตัวละคร: อาร์คาเนีย (Arcania)')
                .setDescription('ได้รับยศพิเศษ <@&1499995786069409812>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1499995318018904104/TA-2026-04-28-12-10-49-1girlbeau-493098240.png?ex=69f6d300&is=69f58180&hm=8b40bc7a611745c91b8afad63071a6c0e367e65059bc57ed2c78b5fb09ea5435&=&format=webp&quality=lossless&width=876&height=876');

            const arcaniaButton = new ButtonBuilder().setCustomId('buy_arcania').setLabel('🐕 โดเนทให้ อาร์คาเนีย (10 บาท)').setStyle(ButtonStyle.Primary);
            const arcaniaRow = new ActionRowBuilder().addComponents(arcaniaButton);
            await message.channel.send({ embeds: [arcaniaEmbed], components: [arcaniaRow] });

             // --- 🧤 ก้อนที่ 4: เนเธอร่า (Nethera) (10 บาท) ---
            const netheraEmbed = new EmbedBuilder()
                .setColor('#931ba3')
                .setTitle('🧤 ตัวละคร: เนเธอร่า (Nethera)')
                .setDescription('ได้รับยศพิเศษ <@&1501427896278061136>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1501428605467492453/TA-2026-04-26-14-36-11-1girl_1.3-3086692428.png?ex=69fc09da&is=69fab85a&hm=0065b505d55f4a7c8eaab321e850dcf666e9e874f21460d3de066756d45e6234&=&format=webp&quality=lossless&width=350&height=350');

            const netheraButton = new ButtonBuilder().setCustomId('buy_nethera').setLabel('🧤 โดเนทให้ เนเธอร่า (10 บาท)').setStyle(ButtonStyle.Primary);
            const netheraRow = new ActionRowBuilder().addComponents(netheraButton);
            await message.channel.send({ embeds: [netheraEmbed], components: [netheraRow] });

            // --- 🔮 ก้อนที่ 5: มิราเชียล (Miraciel) (15 บาท) ---
            const miracielEmbed = new EmbedBuilder()
                .setColor('#e100ff')
                .setTitle('🔮 ตัวละคร: มิราเชียล (Miraciel)')
                .setDescription('ได้รับยศพิเศษ <@&1502562825116323881>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1502563802632163328/TA-2026-05-01-06-02-21-1girlbeau-1255743606-1.png?ex=6a002b16&is=69fed996&hm=c5ec5cdead3976a3f413959bef945bb15618c944df5f29977b9846cd62bccdf0&=&format=webp&quality=lossless&width=876&height=876');

            const miracielButton = new ButtonBuilder().setCustomId('buy_miraciel').setLabel('🔮 โดเนทให้ มิราเชียล (15 บาท)').setStyle(ButtonStyle.Primary);
            const miracielRow = new ActionRowBuilder().addComponents(miracielButton);
            await message.channel.send({ embeds: [miracielEmbed], components: [miracielRow] });

            // --- 🌹 ก้อนที่ 6: เมอร์เซีย (Mercia) (15 บาท) ---
            const merciaEmbed = new EmbedBuilder()
                .setColor('#8b122c')
                .setTitle('🌹 ตัวละคร: เมอร์เซีย (Mercia)')
                .setDescription('ได้รับยศพิเศษ <@&1504571357520986304>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1504572199862800384/TA-2026-05-01-13-51-45-1girlbeau-2227016643-1.png?ex=6a07798e&is=6a06280e&hm=9040ee5833a2cdc3892920f35fde8cfc176d6319a9f69b4170491f19a32cfc90&=&format=webp&quality=lossless&width=876&height=876');

            const merciaButton = new ButtonBuilder().setCustomId('buy_mercia').setLabel('🌹 โดเนทให้ เมอร์เซีย (15 บาท)').setStyle(ButtonStyle.Primary);
            const merciaRow = new ActionRowBuilder().addComponents(merciaButton);
            await message.channel.send({ embeds: [merciaEmbed], components: [merciaRow] });

            // --- 🩵 ก้อนที่ 7: อิลเซียร์ (Ilsier) (10 บาท) ---
            const ilsierEmbed = new EmbedBuilder()
                .setColor('#93b0ff')
                .setTitle('🌹 ตัวละคร: อิลเซียร์ (Ilsier)')
                .setDescription('ได้รับยศพิเศษ <@&1520928768900993085>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1520929359962177710/TA-2026-06-28-10-09-34-1girlbeau-2164187468.png?ex=6a42fb58&is=6a41a9d8&hm=719cac95c9676148a3e9424e9c0d0d4bf7c7f47cafdff723b6db09eec7ad8085&=&format=webp&quality=lossless');

            const ilsierButton = new ButtonBuilder().setCustomId('buy_ilsier').setLabel('🌹 โดเนทให้ อิลเซียร์ (10 บาท)').setStyle(ButtonStyle.Primary);
            const ilsierRow = new ActionRowBuilder().addComponents(ilsierButton);
            await message.channel.send({ embeds: [ilsierEmbed], components: [ilsierRow] });



            await message.delete();
        }
    },
};