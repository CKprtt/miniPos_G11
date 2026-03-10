import { aiModel } from "./ai";

export type QrDemoData = {
  merchantName: string;
  amount: number;
  orderId: string;
  ref1: string;
  ref2: string;
  promptpayId: string;
  note: string;
  receiptUrl: string; // URL สำหรับ encode ลง QR
};

export async function generateQrDemo(
  amount: number,
  orderId: string // รับ orderId จาก Firestore ที่บันทึกไปแล้ว
): Promise<QrDemoData> {
  const safeAmount = Number(amount || 0).toFixed(2);

  const prompt = `
สร้างข้อมูล QR Payment แบบจำลองสำหรับโปรเจกต์ POS นักศึกษา

amount = ${safeAmount}
orderId = ${orderId}

เงื่อนไข
- เป็นข้อมูล DEMO เท่านั้น
- ห้ามเป็นข้อมูลการเงินจริง
- merchantName เป็นชื่อร้านสมมติ
- amount ต้องเท่ากับ ${safeAmount}
- orderId ต้องเท่ากับ ${orderId}
- ref1 และ ref2 ต้องเป็นรหัสสมมติ
- promptpayId เป็นเบอร์สมมติ 10 หลัก
- note ต้องเป็น "DEMO ONLY"
- ตอบกลับเป็น JSON เท่านั้น
- ห้ามมี markdown
- ห้ามมี \`\`\`


{
  "merchantName": "MiniPOS Demo Shop",
  "amount": ${safeAmount},
  "orderId": "${orderId}",
  "ref1": "POS2026",
  "ref2": "DEMO123",
  "promptpayId": "0999999999",
  "note": "DEMO ONLY"
}
`;

  const result = await aiModel.generateContent(prompt);
  const text = result.response.text().trim();

  let cleanText = text;
  if (cleanText.startsWith("```")) {
    cleanText = cleanText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  const parsed = JSON.parse(cleanText);

  // สร้าง URL ที่มือถือจะเปิดเมื่อสแกน QR
const BASE_URL =
  window.location.hostname === "localhost"
    ? "http://192.168.0.106:5173"
    : window.location.origin;

const receiptUrl = `https://ckprtt.github.io/miniPos_G11/#/receipt/${orderId}`;

  return {
    merchantName: String(parsed.merchantName || "MiniPOS Demo Shop"),
    amount: Number(parsed.amount || safeAmount),
    orderId: String(parsed.orderId || orderId),
    ref1: String(parsed.ref1 || "POS2026"),
    ref2: String(parsed.ref2 || "DEMO123"),
    promptpayId: String(parsed.promptpayId || "0999999999"),
    note: String(parsed.note || "DEMO ONLY"),
    receiptUrl,
  };
}
