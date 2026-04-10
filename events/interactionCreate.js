const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { chromium } = require('playwright'); // 📌 เรียกใช้อาวุธ Google Chrome ล่องหน

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        
        if (interaction.isButton()) {
            let modalId = '';
            let modalTitle = '';

            if (interaction.customId === 'buy_yuri') {
                modalId = 'modal_yuri';
                modalTitle = 'โดเนทให้ ยูริ (12 บาท)';
            } else if (interaction.customId === 'buy_sena') {
                modalId = 'modal_sena';
                modalTitle = 'โดเนทให้ เซนะ (10 บาท)';
            } else if (interaction.customId === 'buy_mirei') { 
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

        if (interaction.isModalSubmit()) {
            // ⏳ บอก Discord ให้รอแป๊บนะ เพราะเปิดเบราว์เซอร์อาจจะใช้เวลา 3-5 วินาที
            await interaction.deferReply({ ephemeral: true });

            const twLink = interaction.fields.getTextInputValue('truemoney_link');
            const twLinkRegex = /https:\/\/gift\.truemoney\.com\/campaign\/\?v=([a-zA-Z0-9]+)/;
            const match = twLink.match(twLinkRegex);

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
            else if (interaction.customId === 'modal_mirei') { 
                roleIdToGive = '1490129026990473386'; 
                roleName = 'มิเรย์';
                expectedAmount = 20; 
            }

            let browser;
            try {
                // 🎭 1. เปิด Google Chrome ล่องหน
                browser = await chromium.launch({ headless: true });
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                });
                const page = await context.newPage();

                // 🎭 2. วิ่งไปหน้าเว็บทรูมันนี่ เพื่อให้ Cloudflare ตรวจคุกกี้ (จำลองว่าเราคือคนจริงๆ ที่กดเข้าเว็บ)
                await page.goto(`https://gift.truemoney.com/campaign/?v=${voucherHash}`, { waitUntil: 'networkidle' });

                // 🎭 3. ฝังตัวเข้าไปดึงข้อมูลจาก "ข้างใน" เบราว์เซอร์เลย! รปภ. จับไม่ได้แน่นอน
                const result = await page.evaluate(async ({ hash, phone }) => {
                    
                    // ตรวจสอบซอง
                    const verifyRes = await fetch(`https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${phone}`);
                    const verifyData = await verifyRes.json();

                    if (verifyData.status.code !== 'SUCCESS') {
                        return { step: 'verify', data: verifyData };
                    }

                    // ขอดึงเงิน
                    const redeemRes = await fetch(`https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mobile: phone, voucher_hash: hash })
                    });
                    const redeemData = await redeemRes.json();

                    return { step: 'redeem', verifyData: verifyData, redeemData: redeemData };

                }, { hash: voucherHash, phone: phoneNumber });

                // ปิดเบราว์เซอร์เมื่อทำภารกิจเสร็จ
                await browser.close();

                // --- 🎯 จัดการผลลัพธ์ที่ได้มาจากเบราว์เซอร์ ---
                
                if (result.step === 'verify') {
                    // ถ้าพังตั้งแต่ตอนตรวจซอง
                    const errCode = result.data.status.code;
                    let errorMsg = `❌ ไม่สามารถตรวจสอบซองได้ (รหัสข้อผิดพลาด: ${errCode})`;
                    
                    if (errCode === 'VOUCHER_OUT_OF_STOCK') errorMsg = '❌ ซองอั่งเปานี้ถูกรับไปแล้ว หรือไม่มีเงินเหลืออยู่ครับ';
                    if (errCode === 'VOUCHER_EXPIRED') errorMsg = '❌ ซองอั่งเปานี้หมดอายุแล้วครับ';
                    
                    await interaction.editReply(errorMsg);
                    if (logChannel) logChannel.send(`🔴 **[ทำรายการล้มเหลว]** \`${interaction.user.tag}\` สาเหตุ: ตรวจสอบซองไม่ผ่าน (${errCode})`);
                    return;
                }

                // ถ้าตรวจซองผ่าน เช็คยอดเงิน
                const voucherAmount = parseFloat(result.verifyData.data.voucher_profile.amount_baht);
                if (voucherAmount < expectedAmount) {
                    await interaction.editReply(`❌ **ยอดเงินไม่พอครับ!**\nซองนี้มีเงิน **${voucherAmount} บาท** (ขั้นต่ำสำหรับ ${roleName} คือ ${expectedAmount} บาท)\n*ไม่ต้องกังวลครับ บอทยังไม่ได้ดึงเงินของคุณไป ลิงก์ซองนี้ยังใช้งานได้ปกติครับ*`);
                    if (logChannel) logChannel.send(`🟡 **[เงินไม่พอ - ไม่ได้รับซอง]** \`${interaction.user.tag}\` โดเนทมาแค่ **${voucherAmount} บาท** (ต้องการ ${expectedAmount}) -> เล็งยศ **${roleName}**`);
                    return;
                }

                // เช็คผลการดึงเงิน
                const finalData = result.redeemData;
                if (finalData.status.code === 'SUCCESS') {
                    const amount = parseInt(finalData.data.my_ticket.amount_baht);
                    await interaction.member.roles.add(roleIdToGive);
                    await interaction.editReply(`✅ รับเงินสำเร็จ! จำนวน **${amount} บาท**\n🎉 ระบบได้ทำการมอบยศ **${roleName}** ให้คุณเรียบร้อยแล้ว ขอบคุณที่สนับสนุนครับ!`);
                    if (logChannel) logChannel.send(`🟢 **[โดเนทสำเร็จ]** \`${interaction.user.tag}\` โดเนทสำเร็จ **${amount} บาท** -> ได้รับยศ **${roleName}**`);
                } else {
                    const finalErrCode = finalData.status.code;
                    let errorMsg = `❌ ดึงเงินไม่สำเร็จ (รหัสข้อผิดพลาด: ${finalErrCode})`;
                    
                    if (finalErrCode === 'CANNOT_GET_OWN_VOUCHER') {
                        errorMsg = '✅ บอทตรวจสอบซองสำเร็จ! **แต่รับเงินไม่ได้เพราะ เป็นซองของคุณเองครับ** (ทรูมันนี่บล็อกการรับซองตัวเอง)';
                    }
                    
                    await interaction.editReply(errorMsg);
                    if (logChannel) logChannel.send(`🔴 **[Error ดึงเงินล้มเหลว]** \`${interaction.user.tag}\` รหัสข้อผิดพลาด: ${finalErrCode}`);
                }

            } catch (error) {
                if (browser) await browser.close(); // ป้องกันเบราว์เซอร์ค้างในเครื่อง
                
                console.log('\n========================================');
                console.log('🚨 สแกนพบข้อผิดพลาด:');
                console.log(error.message);
                console.log('========================================\n');

                await interaction.editReply('❌ เกิดข้อผิดพลาดร้ายแรง! บอทไม่สามารถเข้าถึงระบบทรูมันนี่ได้ครับ');
            }
        }
    },
};