# ตั้งค่า Stripe PromptPay สำหรับบอท Omelet

ระบบซองอั่งเปา TrueMoney เดิมยังทำงานอยู่ครบ การตั้งค่านี้เพิ่ม PromptPay เป็นอีกทางเลือกหนึ่งเท่านั้น

## 1. เริ่มในโหมดทดสอบ

1. เปลี่ยน Stripe Dashboard ไปที่ Sandbox/Test mode
2. เปิดหน้า API keys และคัดลอก **Secret key ที่ขึ้นต้นด้วย `sk_test_`**
3. ตั้งค่าตัวแปรของเซิร์ฟเวอร์ตาม `.env.example`
4. ตั้ง `PUBLIC_BASE_URL` เป็น URL HTTPS สาธารณะของบอท ห้ามใส่ URL ของ Stripe Dashboard

อย่าส่ง Secret key ใน Discord แชท ภาพหน้าจอ Git หรือไฟล์ที่อัปโหลดสาธารณะ

## 2. สร้าง webhook โหมดทดสอบ

สร้าง webhook endpoint ใน Stripe ให้ชี้มาที่:

```text
https://โดเมนบอทของคุณ/stripe/webhook
```

เลือกเหตุการณ์:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

นำ Signing secret ที่ขึ้นต้นด้วย `whsec_` ไปตั้งเป็น `STRIPE_WEBHOOK_SECRET` แล้วรีสตาร์ตบอท

## 3. ทดสอบ

1. กดปุ่มตัวละครใน Discord
2. เลือก `PromptPay QR (Stripe)`
3. กรอกยอดตั้งแต่ขั้นต่ำขึ้นไป
4. กดลิงก์ Checkout ที่บอทส่งให้
5. ตรวจว่า Stripe ส่ง webhook และบอทมอบยศถูกคน
6. รัน `npm test` ให้ผ่านทั้งหมด

ระบบจะปฏิเสธ webhook ที่ลายเซ็นไม่ถูกต้อง ยังไม่จ่ายเงิน ยอดต่ำกว่าขั้นต่ำ หรือ metadata ของยศถูกแก้ไข

## 4. เปิดใช้งานจริงหลังทดสอบผ่านเท่านั้น

1. สร้าง webhook ใหม่ใน Live mode ที่ URL เดิม เพราะ Signing secret ของ Test/Live ไม่เหมือนกัน
2. เปลี่ยน `STRIPE_SECRET_KEY` เป็น `sk_live_...`
3. เปลี่ยน `STRIPE_WEBHOOK_SECRET` เป็น Signing secret ของ Live endpoint
4. เพิ่ม `STRIPE_ALLOW_LIVE=true`
5. รีสตาร์ตบอทและทดสอบยอดเล็กหนึ่งครั้ง

หากไม่ได้ตั้ง `STRIPE_ALLOW_LIVE=true` โค้ดจะปฏิเสธคีย์จริงเพื่อป้องกันการรับเงินจริงโดยไม่ตั้งใจ
