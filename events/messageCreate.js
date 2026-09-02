const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

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
            if (!message.inGuild() || !message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                const warning = await message.reply('❌ คำสั่งนี้ใช้ได้เฉพาะแอดมินเซิร์ฟเวอร์ครับ').catch(() => null);
                if (warning) setTimeout(() => warning.delete().catch(() => {}), 5_000);
                return;
            }

            // --- 🍹 ก้อนที่ 13: ส้มจี๊ด (Somjeed) (20 บาท) ---
            const somjeedEmbed = new EmbedBuilder()
                .setColor('#fff893') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🍹 ตัวละคร: ส้มจี๊ด (Somjeed)')
                .setDescription('ได้รับยศพิเศษ <@&1517102688779767829>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1517105198907260928/TA-2026-06-15-12-29-59-1girlbeau-3919768925-0.png?ex=6a3511d1&is=6a33c051&hm=613f1cff3d7916eaf143052fc81483680f0a5d6f4be27e0555ba1f4a74eef311&=&format=webp&quality=lossless');

            const somjeedButton = new ButtonBuilder().setCustomId('buy_somjeed').setLabel('🍹 โดเนทให้ ส้มจี๊ด (20 บาท)').setStyle(ButtonStyle.Primary);
            const somjeedRow = new ActionRowBuilder().addComponents(somjeedButton);
            await message.channel.send({ embeds: [somjeedEmbed], components: [somjeedRow] });

            // --- 🖤 ก้อนที่ 14: มูนา (Muna) (20 บาท) ---
            const munaEmbed = new EmbedBuilder()
                .setColor('#fff893') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🖤 ตัวละคร: มูนา (Muna)')
                .setDescription('ได้รับยศพิเศษ <@&1517943037253128406>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1517943780618145812/1.png?ex=6a381ecf&is=6a36cd4f&hm=38b74e2bc12f282021cfeb998b41c6806e530880d88a01484a155a281eccb730&=&format=webp&quality=lossless');

            const munaButton = new ButtonBuilder().setCustomId('buy_muna').setLabel('🖤 โดเนทให้ มูนา (20 บาท)').setStyle(ButtonStyle.Primary);
            const munaRow = new ActionRowBuilder().addComponents(munaButton);
            await message.channel.send({ embeds: [munaEmbed], components: [munaRow] });

            // --- 🤍 ก้อนที่ 15: ลลิล (Lalinn) (20 บาท) ---
            const lalinnEmbed = new EmbedBuilder()
                .setColor('#ffffff') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🤍 ตัวละคร: ลลิล (Lalinn)')
                .setDescription('ได้รับยศพิเศษ <@&1518995242269937836>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1518995728305750016/1.png?ex=6a3bf283&is=6a3aa103&hm=e062b4b3839931689332b9d187018e81e197f8ef90fbde32eb90eba334f67bad&=&format=webp&quality=lossless&width=350&height=350');

            const lalinnButton = new ButtonBuilder().setCustomId('buy_lalinn').setLabel('🤍 โดเนทให้ ลลิล (20 บาท)').setStyle(ButtonStyle.Primary);
            const lalinnRow = new ActionRowBuilder().addComponents(lalinnButton);
            await message.channel.send({ embeds: [lalinnEmbed], components: [lalinnRow] });

            // --- 🍒 16: เชอร์รี่ (Cherry) (20 บาท) ---
            const cherryEmbed = new EmbedBuilder()
                .setColor('#ff6565') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('🍒 ตัวละคร: เชอร์รี่ (Cherry)')
                .setDescription('ได้รับยศพิเศษ <@&1520031790243254312>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1520032665661870161/1.png?ex=6a3fb83c&is=6a3e66bc&hm=a0e230bbead0ed23deab2e467e5160e01d6921c718f8c523c3906bede1a6f238&=&format=webp&quality=lossless');

            const cherryButton = new ButtonBuilder().setCustomId('buy_cherry').setLabel('🍒 โดเนทให้ เชอร์รี่ (20 บาท)').setStyle(ButtonStyle.Primary);
            const cherryRow = new ActionRowBuilder().addComponents(cherryButton);
            await message.channel.send({ embeds: [cherryEmbed], components: [cherryRow] });

            // --- 📯 17: เอวา (Ava) (20 บาท) ---
            const avaEmbed = new EmbedBuilder()
                .setColor('#ecd491') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('📯 ตัวละคร: เอวา (Ava)')
                .setDescription('ได้รับยศพิเศษ <@&1520368884828475402>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1520369920582484028/1.png?ex=6a40f254&is=6a3fa0d4&hm=bb4008303dab77b27191d18accfcdb98b2dcde702e20d1d040ec62027578b20f&=&format=webp&quality=lossless&width=350&height=350');

            const avaButton = new ButtonBuilder().setCustomId('buy_ava').setLabel('📯 โดเนทให้ เอวา (20 บาท)').setStyle(ButtonStyle.Primary);
            const avaRow = new ActionRowBuilder().addComponents(avaButton);
            await message.channel.send({ embeds: [avaEmbed], components: [avaRow] });

            // --- 👝 18: พิงกี้ (Pinky) (20 บาท) ---
            const pinkyEmbed = new EmbedBuilder()
                .setColor('#ff88a6') // ผมใส่เป็นสีชมพูเข้มให้ครับ จะได้ต่างจากยูริร่างแรก
                .setTitle('👝 ตัวละคร: พิงกี้ (Pinky)')
                .setDescription('ได้รับยศพิเศษ <@&1522943041709805720>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1522943613108228297/1.png?ex=6a4a4f44&is=6a48fdc4&hm=b54a8017493fbc64b869cf24fd438fa032a6c8209c23eb12b3b0d6e1b0633f64&=&format=webp&quality=lossless');

            const pinkyButton = new ButtonBuilder().setCustomId('buy_pinky').setLabel('👝 โดเนทให้ พิงกี้ (20 บาท)').setStyle(ButtonStyle.Primary);
            const pinkyRow = new ActionRowBuilder().addComponents(pinkyButton);
            await message.channel.send({ embeds: [pinkyEmbed], components: [pinkyRow] });

            // --- 🔮 19: คิรา (Kira) (20 บาท) ---
            const kiraEmbed = new EmbedBuilder()
                .setColor('#353535')
                .setTitle('🔮 ตัวละคร: คิรา (Kira)')
                .setDescription('ได้รับยศพิเศษ <@&1525202804476743772>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1525204904325550261/1.png?ex=6a528942&is=6a5137c2&hm=0c3ecb6f7351b776a9cca27ea92d47ec5e8868e4864ba7c9a28c5b73b70d7fd3&=&format=webp&quality=lossless');

            const kiraButton = new ButtonBuilder().setCustomId('buy_kira').setLabel('🔮 โดเนทให้ คิรา (20 บาท)').setStyle(ButtonStyle.Primary);
            const kiraRow = new ActionRowBuilder().addComponents(kiraButton);
            await message.channel.send({ embeds: [kiraEmbed], components: [kiraRow] });

            // --- ✨ 20: เอลลี่ (Ellie) (20 บาท) ---
            const ellieEmbed = new EmbedBuilder()
                .setColor('#353535')
                .setTitle('✨ ตัวละคร: เอลลี่ (Ellie)')
                .setDescription('ได้รับยศพิเศษ <@&1525206620777349140>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1525206528435683368/1.png?ex=6a528ac5&is=6a513945&hm=75108dce9e4d62ab6d4125e4a2644dfa2425ad881035a213fb5dca9f3494f66f&=&format=webp&quality=lossless');

            const ellieButton = new ButtonBuilder().setCustomId('buy_ellie').setLabel('✨ โดเนทให้ เอลลี่ (20 บาท)').setStyle(ButtonStyle.Primary);
            const ellieRow = new ActionRowBuilder().addComponents(ellieButton);
            await message.channel.send({ embeds: [ellieEmbed], components: [ellieRow] });

            // --- 🩷 21: โมจิ (Mochi) (20 บาท) ---
            const mochiEmbed = new EmbedBuilder()
                .setColor('#ff96a8')
                .setTitle('🩷 ตัวละคร: โมจิ (Mochi)')
                .setDescription('ได้รับยศพิเศษ <@&1525756834860896366>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1525757262486835200/1.png?ex=6a548bae&is=6a533a2e&hm=17ccaa57973d1523d4bd9da8dadbefb1d0850f154d7584d5b03f26219f6619f0&=&format=webp&quality=lossless');

            const mochiButton = new ButtonBuilder().setCustomId('buy_mochi').setLabel('🩷 โดเนทให้ โมจิ (20 บาท)').setStyle(ButtonStyle.Primary);
            const mochiRow = new ActionRowBuilder().addComponents(mochiButton);
            await message.channel.send({ embeds: [mochiEmbed], components: [mochiRow] });

            // --- 🥻 22: เพิร์ล (Pearl) (20 บาท) ---
            const pearlEmbed = new EmbedBuilder()
                .setColor('#87ffe1')
                .setTitle('🥻 ตัวละคร: เพิร์ล (Pearl)')
                .setDescription('ได้รับยศพิเศษ <@&1525758230427598908>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1525758968058744963/1.png?ex=6a548d45&is=6a533bc5&hm=0d90ea66a730d9a39ae5b584280f16a3689f6d495158b584700929c305acc2e6&=&format=webp&quality=lossless');

            const pearlButton = new ButtonBuilder().setCustomId('buy_pearl').setLabel('🥻 โดเนทให้ เพิร์ล (20 บาท)').setStyle(ButtonStyle.Primary);
            const pearlRow = new ActionRowBuilder().addComponents(pearlButton);
            await message.channel.send({ embeds: [pearlEmbed], components: [pearlRow] });

            // --- 🖤 23: มีนา (Mina) (50 บาท) ---
            const minaEmbed = new EmbedBuilder()
                .setColor('#171818')
                .setTitle('🖤 ตัวละคร: มีนา (Mina)')
                .setDescription('ได้รับยศพิเศษ <@&1530063180968103996>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1530064683380248596/1.png?ex=6a643747&is=6a62e5c7&hm=7b7aefd1cd10cbe8fef8e526b189f3c8ead44ee6b5ab683a00bad7353f7baac4&=&format=webp&quality=lossless');

            const minaButton = new ButtonBuilder().setCustomId('buy_mina').setLabel('🖤 โดเนทให้ มีนา (50 บาท)').setStyle(ButtonStyle.Primary);
            const minaRow = new ActionRowBuilder().addComponents(minaButton);
            await message.channel.send({ embeds: [minaEmbed], components: [minaRow] });

            // --- 🤎 24: มอร์เวีย (Morvea) (50 บาท) ---
            const morveaEmbed = new EmbedBuilder()
                .setColor('#9e7575')
                .setTitle('🤎 ตัวละคร: มอร์เวีย (Morvea)')
                .setDescription('ได้รับยศพิเศษ <@&1530765429402763315>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1530765918492430336/1.png?ex=6a66c45b&is=6a6572db&hm=38cda0cba741a8e1e7ade98be267ecef52dfcea553363503558b2ac8a61710f4&=&format=webp&quality=lossless&width=350&height=350');

            const morveaButton = new ButtonBuilder().setCustomId('buy_morvea').setLabel('🤎 โดเนทให้ มอร์เวีย (50 บาท)').setStyle(ButtonStyle.Primary);
            const morveaRow = new ActionRowBuilder().addComponents(morveaButton);
            await message.channel.send({ embeds: [morveaEmbed], components: [morveaRow] });

            // --- 🧈 25: ไอวี่ (Ivy) (50 บาท) ---
            const ivyEmbed = new EmbedBuilder()
                .setColor('#ffecae')
                .setTitle('🧈 ตัวละคร: ไอวี่ (Ivy)')
                .setDescription('ได้รับยศพิเศษ <@&1531485909655093438>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1531487931154305185/TA-2026-07-24-06-40-31-solo1girl-61820887-0.png?ex=6a6964c8&is=6a681348&hm=aa618a030f028e607e0ca2ff5a8aec070c62dd65c294bc2023a8984b15d13b41&=&format=webp&quality=lossless');

            const ivyButton = new ButtonBuilder().setCustomId('buy_ivy').setLabel('🧈 โดเนทให้ ไอวี่ (50 บาท)').setStyle(ButtonStyle.Primary);
            const ivyRow = new ActionRowBuilder().addComponents(ivyButton);
            await message.channel.send({ embeds: [ivyEmbed], components: [ivyRow] });

            // --- 📌 26: ซียา (Siya)  (50 บาท) ---
            const siyaEmbed = new EmbedBuilder()
                .setColor('#963844')
                .setTitle('📌 ตัวละคร: ซียา (Siya)')
                .setDescription('ได้รับยศพิเศษ <@&1532699925371158558>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1532699665235972208/TA-2026-07-27-08-02-50-1girlbeau-2223524320-0.png?ex=6a6dcd4c&is=6a6c7bcc&hm=5874d8cd1e67be201f2002812849abdfecbf1e2e958c13ef2145c3b84f3761e5&=&format=webp&quality=lossless');

            const siyaButton = new ButtonBuilder().setCustomId('buy_siya').setLabel('📌 โดเนทให้ ซียา (50 บาท)').setStyle(ButtonStyle.Primary);
            const siyaRow = new ActionRowBuilder().addComponents(siyaButton);
            await message.channel.send({ embeds: [siyaEmbed], components: [siyaRow] });

            // --- 🍥 27: พิม (Pim)  (50 บาท) ---
            const pimEmbed = new EmbedBuilder()
                .setColor('#fce0ff')
                .setTitle('🍽️ ตัวละคร: พิม (Pim)')
                .setDescription('ได้รับยศพิเศษ <@&1532978616529588355>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1532978965671575754/TA-2026-07-23-03-55-35-1girlbeau-3945280976-1.png?ex=6a6ed16a&is=6a6d7fea&hm=193cd2421788aa8bea5e1623d85818d2bf7d61531a52c15540cbdd8e32389d8a&=&format=webp&quality=lossless');

            const pimButton = new ButtonBuilder().setCustomId('buy_pim').setLabel('🍽️ โดเนทให้ พิม (50 บาท)').setStyle(ButtonStyle.Primary);
            const pimRow = new ActionRowBuilder().addComponents(pimButton);
            await message.channel.send({ embeds: [pimEmbed], components: [pimRow] });

            // --- 🍑 28: มิว (Mew)  (50 บาท) ---
            const mewEmbed = new EmbedBuilder()
                .setColor('#ff87c3')
                .setTitle('🍑 ตัวละคร: มิว (Mew)')
                .setDescription('ได้รับยศพิเศษ <@&1535289114566336543>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1535289729551966278/TA-2026-08-03-21-09-04-1girlbeau-248945797-1.png?ex=6a77397b&is=6a75e7fb&hm=2b8bdd3b14430a633267691244f9155f588744b6c0e0525ea89dd81728484e27&=&format=webp&quality=lossless');

            const mewButton = new ButtonBuilder().setCustomId('buy_mew').setLabel('🍑 โดเนทให้ มิว (50 บาท)').setStyle(ButtonStyle.Primary);
            const mewRow = new ActionRowBuilder().addComponents(mewButton);
            await message.channel.send({ embeds: [mewEmbed], components: [mewRow] });

            // --- 🖤 29: มุก (Mook)  (50 บาท) ---
            const mookEmbed = new EmbedBuilder()
                .setColor('#0a072c')
                .setTitle('🖤 ตัวละคร: มุก (Mook)')
                .setDescription('ได้รับยศพิเศษ <@&1535535694271881307>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1535536507069137037/TA-2026-07-30-17-05-31-1girlbeau-1906410969-1.png?ex=6a781f50&is=6a76cdd0&hm=776ce9975554701cb5ca00c8ff4f19ce31948da7cba8071f98d4b7ac64c809dc&=&format=webp&quality=lossless');

            const mookButton = new ButtonBuilder().setCustomId('buy_mook').setLabel('🖤 โดเนทให้ มุก (50 บาท)').setStyle(ButtonStyle.Primary);
            const mookRow = new ActionRowBuilder().addComponents(mookButton);
            await message.channel.send({ embeds: [mookEmbed], components: [mookRow] });

            // --- 🖤 30: นาริ (Nari)  (55 บาท) ---
            const nariEmbed = new EmbedBuilder()
                .setColor('#0a072c')
                .setTitle('🖤 ตัวละคร: นาริ (Nari)')
                .setDescription('ได้รับยศพิเศษ <@&1535866569295405137>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1535867054727626773/TA-2026-07-29-18-11-17-1girlbeau-1107015216-0.png?ex=6a795328&is=6a7801a8&hm=efda928eae25b6cadfabbd210e58b90b053fb27b3da496260b6b8d4a898156d7&=&format=webp&quality=lossless&width=320&height=320');

            const nariButton = new ButtonBuilder().setCustomId('buy_nari').setLabel('🖤 โดเนทให้ นาริ (55 บาท)').setStyle(ButtonStyle.Primary);
            const nariRow = new ActionRowBuilder().addComponents(nariButton);
            await message.channel.send({ embeds: [nariEmbed], components: [nariRow] });

            // --- 🤍 31: เซีย (Sia)  (55 บาท) ---
            const siaEmbed = new EmbedBuilder()
                .setColor('#0a072c')
                .setTitle('🤍 ตัวละคร: เซีย (Sia)')
                .setDescription('ได้รับยศพิเศษ <@&1536518835161800825>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1536519271994368111/TA-2026-08-05-19-20-03-1girlbeau-1736922506-1.png?ex=6a7bb295&is=6a7a6115&hm=a650eaa7d51e2abfd24112a6741d33551d7b66d08e0613244f64858c550b6e4f&=&format=webp&quality=lossless');

            const siaButton = new ButtonBuilder().setCustomId('buy_sia').setLabel('🤍 โดเนทให้ เซีย (55 บาท)').setStyle(ButtonStyle.Primary);
            const siaRow = new ActionRowBuilder().addComponents(siaButton);
            await message.channel.send({ embeds: [siaEmbed], components: [siaRow] });

            // --- 💜 32: แพรว (Praew)  (50 บาท) ---
            const praewEmbed = new EmbedBuilder()
                .setColor('#aa71b6')
                .setTitle('💜 ตัวละคร: แพรว (Praew)')
                .setDescription('ได้รับยศพิเศษ <@&1537670593875410974>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1537671334358949919/TA-2026-08-11-07-46-52-1girlbeau-785271317.png?ex=6a7fe386&is=6a7e9206&hm=f83eb090577629e499370e9bb7f385fbfb0548e468d61b0b80af8a3ec08f6046&=&format=webp&quality=lossless&width=320&height=320');

            const praewButton = new ButtonBuilder().setCustomId('buy_praew').setLabel('💜 โดเนทให้ แพรว (50 บาท)').setStyle(ButtonStyle.Primary);
            const praewRow = new ActionRowBuilder().addComponents(praewButton);
            await message.channel.send({ embeds: [praewEmbed], components: [praewRow] });

            // --- 🩷 33: พั้นช์ (Punch)  (55 บาท) ---
            const punchEmbed = new EmbedBuilder()
                .setColor('#ffa8cc')
                .setTitle('🩷 ตัวละคร: พั้นช์ (Punch)')
                .setDescription('ได้รับยศพิเศษ <@&1538023689910755409>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1538024249174790154/TA-2026-08-13-06-22-35-1girlbeau-1694968891.png?ex=6a812c34&is=6a7fdab4&hm=a91f38bb548c4f6cd30927d7adef3b82a88f09a669f6dbcc72dcbf4bb239cd62&=&format=webp&quality=lossless');

            const punchButton = new ButtonBuilder().setCustomId('buy_punch').setLabel('🩷 โดเนทให้ พั้นช์ (55 บาท)').setStyle(ButtonStyle.Primary);
            const punchRow = new ActionRowBuilder().addComponents(punchButton);
            await message.channel.send({ embeds: [punchEmbed], components: [punchRow] });

            // --- 🩷 34: ลูกหว้า (Lukwa)  (55 บาท) ---
            const lukwaEmbed = new EmbedBuilder()
                .setColor('#530512')
                .setTitle('🩷 ตัวละคร: ลูกหว้า (Lukwa)')
                .setDescription('ได้รับยศพิเศษ <@&1543464539322974280>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1543465650687574097/TA-2026-08-25-07-21-02-1girlbeau-3236388993.png?ex=6a94f7e7&is=6a93a667&hm=908ceda55ec2f6db3d65ccb1878aefda871d6b6faf52b5ef71ed07e533a9dcf0&=&format=webp&quality=lossless');

            const lukwaButton = new ButtonBuilder().setCustomId('buy_lukwa').setLabel('🩷 โดเนทให้ ลูกหว้า (55 บาท)').setStyle(ButtonStyle.Primary);
            const lukwaRow = new ActionRowBuilder().addComponents(lukwaButton);
            await message.channel.send({ embeds: [lukwaEmbed], components: [lukwaRow] });

            // --- 🩵 35: สกาย (Sky)  (55 บาท) ---
            const skyEmbed = new EmbedBuilder()
                .setColor('#d3f8ff')
                .setTitle('🩵 ตัวละคร: สกาย (Sky)')
                .setDescription('ได้รับยศพิเศษ <@&1544153385723240448>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1544153734370557962/TA-2026-08-25-12-23-52-1girlbeau-1806558747.png?ex=6a9778bb&is=6a96273b&hm=f8cdf994512ae04f56992c900e392985718a875eca7d5bd678aa224f977cf495&=&format=webp&quality=lossless&width=384&height=384');

            const skyButton = new ButtonBuilder().setCustomId('buy_sky').setLabel('🩵 โดเนทให้ สกาย (55 บาท)').setStyle(ButtonStyle.Primary);
            const skyRow = new ActionRowBuilder().addComponents(skyButton);
            await message.channel.send({ embeds: [skyEmbed], components: [skyRow] });

            // --- 🎱 36: ยูมิ (Yumi)  (50 บาท) ---
            const yumiEmbed = new EmbedBuilder()
                .setColor('#0f0f0f')
                .setTitle('🎱 ตัวละคร: ยูมิ (Yumi)')
                .setDescription('ได้รับยศพิเศษ <@&1544855841948180530>') 
                .setImage('https://media.discordapp.net/attachments/1489853742462533762/1544856348557049967/TA-2026-09-02-03-34-38-1girlbeau-2216835120.png?ex=6a9a0717&is=6a98b597&hm=590ee16681380534a7c2f0cd79932e200cdc456e537791c2d9ea2a6af0fd003c&=&format=webp&quality=lossless&width=384&height=384');

            const yumiButton = new ButtonBuilder().setCustomId('buy_yumi').setLabel('🎱 โดเนทให้ ยูมิ (50 บาท)').setStyle(ButtonStyle.Primary);
            const yumiRow = new ActionRowBuilder().addComponents(yumiButton);
            await message.channel.send({ embeds: [yumiEmbed], components: [yumiRow] });

            await message.delete().catch(() => {});
        }
    },
};
