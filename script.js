/* ==========================================================
   script.js — ตัวควบคุมการเปลี่ยนหน้าและคิดคะแนน
   เว็บนี้มีหน้า HTML หน้าเดียว แต่ละ "หน้า" ของควิซคือการลบเนื้อหาเก่า
   แล้ววาดเนื้อหาใหม่ลงในกล่อง <main id="app"> แทน

   มี 3 หน้า:
     showStart()       หน้าแรก
     showQuestion(i)   หน้าคำถามข้อที่ i (เริ่มนับจาก 0)
     showEnd()         หน้าผลลัพธ์

   และ 2 ฟังก์ชันคะแนน:
     calculateScores() รวมแต้มของทุกสาขาจากคำตอบที่เลือก
     findWinner()      หาสาขาที่แต้มสูงสุด
   ========================================================== */

const app = document.getElementById("app");

// เก็บว่าผู้เล่นตอบข้อไหนอะไร เช่น [0, 2, 1] = ข้อ 1 ตอบตัวเลือกแรก ...
let answers = [];


/* ---------- หน้าแรก ---------- */
function showStart() {
  answers = [];
  app.innerHTML = `
    <section class="page">
      ${QUIZ.coverImage ? `<img class="cover" src="${QUIZ.coverImage}" alt="">` : ""}
      <h1>${QUIZ.title}</h1>
      <p class="subtitle">${QUIZ.subtitle}</p>
      <button class="btn-main" id="start">${QUIZ.startButton}</button>
    </section>
  `;
  document.getElementById("start").onclick = () => showQuestion(0);
}


/* ---------- หน้าคำถาม ---------- */
function showQuestion(index) {
  const q = QUESTIONS[index];
  const total = QUESTIONS.length;

  // สร้างปุ่มคำตอบทีละปุ่ม
  const choiceButtons = q.choices
    .map((choice, i) => `<button class="choice" data-choice="${i}">${choice.text}</button>`)
    .join("");

  app.innerHTML = `
    <section class="page">
      <div class="top">
        <button class="btn-back" id="back" aria-label="ย้อนกลับ">←</button>
        <div class="progress"><div class="progress-fill" style="width:${(index / total) * 100}%"></div></div>
        <span class="count">${index + 1}/${total}</span>
      </div>

      ${q.image ? `<img class="q-image" src="${q.image}" alt="">` : ""}
      <h2 class="question">${q.question}</h2>
      <div class="choices">${choiceButtons}</div>
    </section>
  `;

  // กดย้อนกลับ: ข้อแรกกลับไปหน้าแรก ข้ออื่นกลับไปข้อก่อนหน้า
  document.getElementById("back").onclick = () =>
    index === 0 ? showStart() : showQuestion(index - 1);

  // กดคำตอบ: จำคำตอบไว้ แล้วไปหน้าถัดไป
  app.querySelectorAll(".choice").forEach((button) => {
    button.onclick = () => {
      answers[index] = Number(button.dataset.choice);
      button.classList.add("picked");

      // หน่วงเวลาเล็กน้อยให้เห็นว่ากดแล้ว ก่อนเลื่อนไปหน้าถัดไป
      setTimeout(() => {
        if (index + 1 < total) showQuestion(index + 1);
        else showEnd();
      }, 250);
    };
  });
}


/* ---------- คิดคะแนน ---------- */
// วนดูทุกข้อที่ตอบ แล้วบวกแต้มตาม scores ของตัวเลือกที่เลือก
// ผลที่ได้ เช่น { CE: 1, ChE: 0, CPE: 2, ... }
function calculateScores() {
  const totals = {};
  for (const code in RESULTS) totals[code] = 0;          // ทุกสาขาเริ่มที่ 0

  answers.forEach((choiceIndex, questionIndex) => {
    const choice = QUESTIONS[questionIndex].choices[choiceIndex];
    for (const code in choice.scores) {
      totals[code] += choice.scores[code];
    }
  });
  return totals;
}

// หาสาขาที่ได้คะแนนสูงสุด ถ้าเสมอกัน อันที่อยู่บนกว่าใน results.js ชนะ
function findWinner(totals) {
  let winner = null;
  for (const code in totals) {
    if (winner === null || totals[code] > totals[winner]) winner = code;
  }
  return winner;
}


/* ---------- หน้าผลลัพธ์ ---------- */
function showEnd() {
  const totals = calculateScores();
  const winner = findWinner(totals);
  const r = RESULTS[winner];

  // รายการคะแนนทุกสาขา เรียงจากมากไปน้อย (ไว้ดูตอนทดสอบ)
  const scoreList = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([code, pts]) => `<li><span>${code} · ${RESULTS[code].dept}</span><b>${pts}</b></li>`)
    .join("");

  app.innerHTML = `
    <section class="page">
      <p class="subtitle">ดาวประจำตัวของคุณคือ</p>
      ${r.image ? `<img class="cover" src="${r.image}" alt="">` : ""}
      <h1>${r.title}</h1>
      <p class="result-dept">${r.dept}</p>
      <p>${r.description}</p>
      <details class="debug">
        <summary>ดูคะแนนทุกสาขา</summary>
        <ul class="score-list">${scoreList}</ul>
      </details>
      <button class="btn-main" id="again">เล่นอีกครั้ง</button>
    </section>
  `;
  document.getElementById("again").onclick = showStart;
}


// เริ่มที่หน้าแรก
showStart();