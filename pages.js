/* ==========================================================
   pages.js — เนื้อหาของหน้า "เอกสาร" และ "เครดิต" (แก้ไฟล์นี้ไฟล์เดียว)
   ----------------------------------------------------------
   DOCS    เอกสารแบบไฟล์รูป (png / jpg / webp) แสดงเรียงต่อกันลงมา กดที่รูปเพื่อดูขนาดเต็ม
           1) วางไฟล์รูปไว้ในโฟลเดอร์ docs/
           2) เพิ่มบรรทัด { title, images, note } ด้านล่าง
              images ใส่ได้หลายรูป เรียงตามลำดับหน้า / note ไม่ใส่ก็ได้
   CREDITS เครดิต/หมายเหตุ แต่ละ [ ... ] = หนึ่งกรอบ ข้างในหนึ่งช่อง = หนึ่งย่อหน้า
           ลิงก์ที่ขึ้นต้นด้วย https:// จะกดได้เอง ไม่ต้องใส่ <a>
   INSTAGRAM ลิงก์ Instagram ท้ายหน้าเครดิต (โลโก้ + ชื่อ) ลบทั้งก้อนถ้าไม่อยากให้แสดง
   ข้อความทุกช่องใส่ <b>…</b> หรือ <a href="…">…</a> ได้
   ========================================================== */

const DOCS = [
  /*{ title: "Undergraduate Catalog 2026", file: "docs/Undergraduate Catalog 2026 p.2.pdf", note: "รายละเอียดหลักสูตรปริญญาตรีทุกภาค" },*/
  {title: "Life at SIIT (student guide)", images: ["docs/ใบปลิว (5).png", "docs/ใบปลิว (6).png"] }

];

const CREDITS = [
  [
    "จัดทำโดย คณะกรรมการนักศึกษา SIIT SC #33",
    "<b>หมายเหตุ</b>",
    "แบบทดสอบนี้ทำเป็นเพียงแนวทางในการตัดสินใจเท่านั้น ไม่ใช่การตัดสินว่าจะต้องเรียนในสาขาอะไร คำถามที่ใช้เป็นเพียงมุมมองและการตีความเนื้อหาหลักสูตร อาจมีความคลาดเคลื่อนในการคำนวณผลลัพธ์"
  ],
  [
    "<b>Background music</b>",
    "Tokyo Music Walker - After The Rain is under a Creative Commons BY 3.0 license.<br>https://creativecommons.org/licenses/by-sa/3.0/",
    "Tokyo Music Walker<br>https://www.youtube.com/channel/UC3lLfvhpPGtwd5qD25cMDcA",
    "Music powered by BreakingCopyright<br>https://breakingcopyright.com"
  ]
];

const INSTAGRAM = {
  name: "SIIT Student Committee",
  url: "https://www.instagram.com/siit.studentcommittee?utm_source=ig_web_button_share_sheet&xtok=ZDNlZDc0MzIxNw=="
};
