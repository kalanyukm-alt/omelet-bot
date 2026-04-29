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


            // ลบข้อความคำสั่ง !up2 ทิ้ง
            await message.delete();
        }
    },
};