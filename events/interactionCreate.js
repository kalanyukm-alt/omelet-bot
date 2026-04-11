const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { chromium } = require('playwright'); // 📌 อาวุธทะลวงเกราะของเรา (ห้ามทิ้งเด็ดขาด!)

// ===== CONFIG: ข้อมูลตัวละคร (เพิ่มตัวใหม่แค่มาแก้ตรงนี้) =====
const ROLE_CONFIG = {
    buy_yuri:   { modalId: 'modal_yuri',  title: 'โดเนทให้ ยูริ (12 บาท)',  roleId: '1489704389198217367', roleName: 'ยูริ',  amount: 12  },
    buy_sena:   { modalId: 'modal_sena',  title: 'โดเนทให้ เซนะ (10 บาท)',  roleId: '1489705449094643872', roleName: 'เซนะ',  amount: 10  },
    buy_mirei:  { modalId: 'modal_mirei', title: 'โดเนทให้ มิเรย์ (20 บาท)', roleId: '1490129026990473386', roleName: 'มิเรย์', amount: 20  },
    buy_lalin:  { modalId: 'modal_lalin', title: 'โดเนทให้ ลลิน (15 บาท)',  roleId: '1492199679977586752', roleName: 'ลลิน',  amount: 15  },
};

const MODAL_TO_CONFIG = Object.fromEntries(
    Object.values(ROLE_CONFIG).map(cfg => [cfg.modalId, cfg])
);

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {

        // ─── กดปุ่ม → เปิด Modal ───
        if (interaction.isButton()) {
            const config = ROLE_CONFIG[interaction.customId];
            if (!config) return;

            const modal = new ModalBuilder()
                .setCustomId(config.modalId)
                .setTitle(config.title);

            const linkInput = new TextInputBuilder()
                .setCustomId('truemoney_link')
                .setLabel('วางลิงก์ซองอั่งเปา TrueMoney ที่นี่')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://gift.truemoney.com/campaign/?v=...')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(linkInput));
            return await interaction.showModal(modal);
        }

        // ─── กรอก Modal → ประมวลผล ───
        if (interaction.isModalSubmit()) {
            await interaction.deferReply({ ephemeral: true });

            const config = MODAL_TO_CONFIG[interaction.customId];
            if (!config) return;

            const logChannel = interaction.client.channels.cache.get(process.env.LOG_CHANNEL);
            const phoneNumber = process.env.PHONE_NUMBER;
            const twLink = interaction.fields.getTextInputValue('truemoney_link');

            const match = twLink.match(/https:\/\/gift\.truemoney\.com\/campaign\/\?v=([a-zA-Z0-9]+)/);
            if (!match) {
                return await interaction.editReply('❌ ลิงก์ไม่ถูกต้องครับ กรุณาใช้ลิงก์ซองอั่งเปา TrueMoney เท่านั้น');
            }

            const voucherHash = match[1];
            let browser;

            try {
                // 🛡️ เปิดเกราะ Playwright บุกเข้าระบบ
                browser = await chromium.launch({ headless: true });
                const context = await browser.newContext({
                    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
                });
                const page = await context.newPage();
                await page.goto(`https://gift.truemoney.com/campaign/?v=${voucherHash}`, { waitUntil: 'networkidle' });

                // 🎭 สั่งให้บอททำงาน "ข้างใน" เบราว์เซอร์ (เพื่อหลบ Cloudflare)
                const result = await page.evaluate(async ({ hash, phone, configAmount }) => {
                    
                    // 1. ตรวจซอง
                    const verifyRes = await fetch(`https://gift.truemoney.com/campaign/vouchers/${hash}/verify?mobile=${phone}`);
                    const verifyData = await verifyRes.json();
                    const verifyCode = verifyData?.status?.code;

                    if (verifyCode !== 'SUCCESS') {
                        return { step: 'verify_failed', code: verifyCode };
                    }

                    // 2. ดึงยอดเงิน (ใช้ตรรกะสุดฉลาดของ Claude)
                    const d = verifyData?.data;
                    const raw = d?.voucher?.amount_baht ?? d?.voucher_profile?.amount_baht ?? d?.amount_baht ?? d?.voucher?.amount ?? null;
                    const voucherAmount = raw ? parseFloat(raw) : null;

                    if (voucherAmount === null) return { step: 'cannot_read_amount', data: verifyData?.data };
                    
                    // 3. ตรวจเงินว่าพอไหมก่อนดึง
                    if (voucherAmount < configAmount) return { step: 'insufficient', amount: voucherAmount };

                    // 4. ดึงเงิน
                    const redeemRes = await fetch(`https://gift.truemoney.com/campaign/vouchers/${hash}/redeem`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mobile: phone, voucher_hash: hash })
                    });
                    const redeemData = await redeemRes.json();

                    return { step: 'redeemed', amount: voucherAmount, code: redeemData?.status?.code };

                }, { hash: voucherHash, phone: phoneNumber, configAmount: config.amount });

                await browser.close();

                // ─── จัดการผลลัพธ์ที่ได้กลับมา ───
                if (result.step === 'verify_failed') {
                    const messages = {
                        VOUCHER_OUT_OF_STOCK: '❌ ซองอั่งเปานี้ถูกรับไปแล้ว หรือไม่มีเงินเหลืออยู่ครับ',
                        VOUCHER_EXPIRED:      '❌ ซองอั่งเปานี้หมดอายุแล้วครับ',
                    };
                    const errorMsg = messages[result.code] ?? `❌ ไม่สามารถตรวจสอบซองได้ (รหัส: ${result.code})`;
                    await interaction.editReply(errorMsg);
                    logChannel?.send(`🔴 **[ตรวจซองล้มเหลว]** \`${interaction.user.tag}\` → ${result.code}`);
                } 
                else if (result.step === 'cannot_read_amount') {
                    await interaction.editReply('❌ ไม่สามารถอ่านยอดเงินจากซองได้ครับ กรุณาติดต่อแอดมิน');
                    logChannel?.send(`🔴 **[อ่านยอดเงินไม่ได้]** \`${interaction.user.tag}\``);
                }
                else if (result.step === 'insufficient') {
                    await interaction.editReply(
                        `❌ **ยอดเงินไม่พอครับ!**\n` +
                        `ซองนี้มีเงิน **${result.amount} บาท** (ขั้นต่ำสำหรับ ${config.roleName} คือ ${config.amount} บาท)\n` +
                        `*บอทยังไม่ได้ดึงเงินของคุณไป ลิงก์ซองนี้ยังใช้งานได้ปกติครับ*`
                    );
                    logChannel?.send(`🟡 **[เงินไม่พอ]** \`${interaction.user.tag}\` ส่ง **${result.amount} บาท** (ต้องการ ${config.amount} บาท สำหรับยศ ${config.roleName})`);
                }
                else if (result.step === 'redeemed') {
                    if (result.code !== 'SUCCESS') {
                        let errorMsg = `❌ ดึงเงินไม่สำเร็จ (รหัส: ${result.code})`;
                        if (result.code === 'CANNOT_GET_OWN_VOUCHER') errorMsg = '✅ ตรวจสอบซองสำเร็จ แต่รับไม่ได้เพราะเป็นซองของคุณเองครับ';
                        await interaction.editReply(errorMsg);
                        logChannel?.send(`🔴 **[ดึงเงินล้มเหลว]** \`${interaction.user.tag}\` → ${result.code}`);
                        return;
                    }

                    // ให้ยศ (แยก error ตามที่ Claude แนะนำ)
                    try {
                        await interaction.member.roles.add(config.roleId);
                        await interaction.editReply(`✅ รับเงินสำเร็จ **${result.amount} บาท**!\n🎉 ระบบมอบยศ **${config.roleName}** ให้คุณเรียบร้อยแล้ว ขอบคุณที่สนับสนุนครับ!`);
                        logChannel?.send(`🟢 **[โดเนทสำเร็จ]** \`${interaction.user.tag}\` โดเนท **${result.amount} บาท** → ได้รับยศ **${config.roleName}**`);
                    } catch (roleError) {
                        await interaction.editReply(`✅ รับเงินสำเร็จ **${result.amount} บาท** แล้วครับ!\n❗ แต่ระบบให้ยศไม่ได้ กรุณาติดต่อแอดมินเพื่อรับยศ **${config.roleName}** ด้วยตนเองครับ`);
                        logChannel?.send(`🔴 **[ให้ยศล้มเหลว — แอดมินตรวจสอบด่วน!]**\n👤 User: \`${interaction.user.tag}\`\n💰 ดึงเงิน: **${result.amount} บาท**\n⚠️ Error: \`${roleError.message}\``);
                    }
                }

            } catch (error) {
                if (browser) await browser.close();
                console.error('[ERROR] interactionCreate:', error);
                await interaction.editReply('❌ เกิดข้อผิดพลาดร้ายแรงครับ บอทไม่สามารถเข้าถึงระบบได้');
                logChannel?.send(`🔴 **[System Error]** \`${interaction.user.tag}\` → \`${error.message}\``);
            }
        }
    },
};