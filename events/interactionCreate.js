const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        
        // 1. ถ้ายูสเซอร์ "คลิกปุ่ม"
        if (interaction.isButton()) {
            let modalId = '';
            let modalTitle = '';

            if (interaction.customId === 'buy_yuri') {
                modalId = 'modal_yuri';
                modalTitle = 'โดเนทให้ ยูริ (12 บาท)';
            } else if (interaction.customId === 'buy_sena') {
                modalId = 'modal_sena';
                modalTitle = 'โดเนทให้ เซนะ (10 บาท)';
            } else if (interaction.customId === 'buy_mirei') { // 💜 เพิ่มของมิเรย์ตรงนี้
                modalId = 'modal_mirei';
                modalTitle = 'โดเนทให้ มิเรย์ (20 บาท)';
            } else {
                return;
            }

            const modal = new ModalBuilder().setCustomId(modalId).setTitle(modalTitle);
            const linkInput = new TextInputBuilder()
                .setCustomId('truemoney_link')
                .setLabel('วางลิงก์ซองอั่งเปา TrueMoney ที่นี่')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://gift.truemoney.com/campaign/?v=...')
                .setRequired(true);

            const firstActionRow = new ActionRowBuilder().addComponents(linkInput);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }

        // 2. ถ้ายูสเซอร์ "กดส่งหน้าต่าง Modal"
        if (interaction.isModalSubmit()) {
            await interaction.deferReply({ ephemeral: true });

            const twLink = interaction.fields.getTextInputValue('truemoney_link');
            const twLinkRegex = /https:\/\/gift\.truemoney\.com\/campaign\/\?v=([a-zA-Z0-9]+)/;
            const match = twLink.match(twLinkRegex);

            // ใช้ interaction.client แทน client เฉยๆ เพื่อหาห้อง Log
            const logChannel = interaction.client.channels.cache.get(process.env.LOG_CHANNEL);

            if (!match) {
                return await interaction.editReply('❌ ลิงก์ไม่ถูกต้องครับ กรุณาใช้ลิงก์ซองอั่งเปา TrueMoney เท่านั้น');
            }

            const voucherHash = match[1];
            const phoneNumber = process.env.PHONE_NUMBER;

            let expectedAmount = 0; 
            let roleIdToGive = '';
            let roleName = '';

            if (interaction.customId === 'modal_yuri') {
                roleIdToGive = '1489704389198217367';
                roleName = 'ยูริ';
                expectedAmount = 12; 
            } 
            else if (interaction.customId === 'modal_sena') {
                roleIdToGive = '1489705449094643872';
                roleName = 'เซนะ';
                expectedAmount = 10; 
            }
            else if (interaction.customId === 'modal_mirei') { // 💜 เพิ่มของมิเรย์ตรงนี้
                roleIdToGive = '1490129026990473386'; // ไอดีมิเรย์
                roleName = 'มิเรย์';
                expectedAmount = 20; // ราคา 20 บาท
            }

            try {
                // Verify เงินก่อน
                const verifyResponse = await axios.get(`https://gift.truemoney.com/campaign/vouchers/${voucherHash}/verify?mobile=${phoneNumber}`);
                const verifyData = verifyResponse.data;

                if (verifyData.status.code === 'SUCCESS') {
                    const voucherAmount = parseFloat(verifyData.data.voucher_profile.amount_baht);

                    if (voucherAmount < expectedAmount) {
                        await interaction.editReply(`❌ **ยอดเงินไม่พอครับ!**\nซองนี้มีเงิน **${voucherAmount} บาท** (ขั้นต่ำสำหรับ ${roleName} คือ ${expectedAmount} บาท)\n*ไม่ต้องกังวลครับ บอทยังไม่ได้ดึงเงินของคุณไป ลิงก์ซองนี้ยังใช้งานได้ปกติครับ*`);
                        if (logChannel) logChannel.send(`🟡 **[เงินไม่พอ - ไม่ได้รับซอง]** \`${interaction.user.tag}\` โดเนทมาแค่ **${voucherAmount} บาท** (ต้องการ ${expectedAmount}) -> เล็งยศ **${roleName}**`);
                        return;
                    }

                    // ดึงเงิน
                    const redeemResponse = await axios.post(`https://gift.truemoney.com/campaign/vouchers/${voucherHash}/redeem`, {
                        mobile: phoneNumber,
                        voucher_hash: voucherHash
                    });

                    const redeemData = redeemResponse.data;

                    if (redeemData.status.code === 'SUCCESS') {
                        const amount = parseInt(redeemData.data.my_ticket.amount_baht);
                        await interaction.member.roles.add(roleIdToGive);
                        await interaction.editReply(`✅ รับเงินสำเร็จ! จำนวน **${amount} บาท**\n🎉 ระบบได้ทำการมอบยศ **${roleName}** ให้คุณเรียบร้อยแล้ว ขอบคุณที่สนับสนุนครับ!`);
                        if (logChannel) logChannel.send(`🟢 **[โดเนทสำเร็จ]** \`${interaction.user.tag}\` โดเนทสำเร็จ **${amount} บาท** -> ได้รับยศ **${roleName}**`);
                    } else {
                        await interaction.editReply(`❌ ดึงเงินไม่สำเร็จ (รหัสข้อผิดพลาด: ${redeemData.status.code})`);
                        if (logChannel) logChannel.send(`🔴 **[Error ดึงเงินล้มเหลว]** \`${interaction.user.tag}\` รหัสข้อผิดพลาด: ${redeemData.status.code}`);
                    }
                } else {
                    await interaction.editReply(`❌ ไม่สามารถตรวจสอบซองได้ (รหัสข้อผิดพลาด: ${verifyData.status.code})`);
                    if (logChannel) logChannel.send(`🔴 **[Error ตรวจสอบซองล้มเหลว]** \`${interaction.user.tag}\` รหัสข้อผิดพลาด: ${verifyData.status.code}`);
                }

            } catch (error) {
                const errorData = error.response?.data?.status;
                let errorMsg = '❌ เกิดข้อผิดพลาด! ลิงก์ซองไม่ถูกต้อง หรือระบบทรูมันนี่มีปัญหาครับ';
                let logMsg = 'ลิงก์ปลอม หรือ Error ทั่วไป';

                if (errorData?.code === 'VOUCHER_OUT_OF_STOCK') {
                    errorMsg = '❌ ซองอั่งเปานี้ถูกรับไปแล้ว หรือไม่มีเงินเหลืออยู่ครับ';
                    logMsg = 'ซองถูกรับไปแล้ว (VOUCHER_OUT_OF_STOCK)';
                } else if (errorData?.code === 'VOUCHER_EXPIRED') {
                    errorMsg = '❌ ซองอั่งเปานี้หมดอายุแล้วครับ';
                    logMsg = 'ซองหมดอายุ (VOUCHER_EXPIRED)';
                }

                await interaction.editReply(errorMsg);
                if (logChannel) logChannel.send(`🔴 **[ทำรายการล้มเหลว]** \`${interaction.user.tag}\` สาเหตุ: **${logMsg}**`);
            }
        }
    },
};