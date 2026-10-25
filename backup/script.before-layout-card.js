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

/* ==========================================================
   script.js — ตัวควบคุมเกม
   หน้า:  showStart() / showStory(s) / showQuestion(s) / showResult()
   คะแนน: calculate()
   กราฟ:  radarChart() แผนภาพ 8 เหลี่ยม / rankBars() 3 อันดับ / axisBars() แกนนิสัย
   ========================================================== */

const app = document.getElementById("app");
const CODES = Object.keys(RESULTS);          // ลำดับภาคตาม results.js

let step = -1;          // -1 = หน้าแรก, STEPS.length = หน้าผล
let answers = {};       // answers[ลำดับหน้า] = ตัวเลือกที่เลือก (เลขเดิมใน questions.js)
let order = {};         // ลำดับตัวเลือกที่สุ่มแล้วของแต่ละข้อ

// ลำดับหน้าคำถามทั้งหมด ไว้ทำแถบความคืบหน้า "ข้อ 3/10"
const QUESTION_STEPS = STEPS.map((s, i) => (s.type === "question" ? i : -1)).filter(i => i >= 0);


/* ---------- ตัวเปลี่ยนหน้า ---------- */
function go(delta) {
  step += delta;
  render();
  window.scrollTo(0, 0);
}

function render() {
  if (step < 0) return showStart();
  if (step >= STEPS.length) return showResult();
  const s = STEPS[step];
  if (s.type === "story") showStory(s);
  else showQuestion(s);
}

function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


/* ---------- หน้าแรก ---------- */
function showStart() {
  answers = {};
  order = {};
  STEPS.forEach((s, i) => { if (s.type === "question") order[i] = shuffle(s.choices.length); });

  app.innerHTML = `
    <section class="page center">
      ${QUIZ.coverImage ? `<img class="cover" src="${QUIZ.coverImage}" alt="">` : ""}
      <h1>${QUIZ.title}</h1>
      <p class="subtitle">${QUIZ.subtitle}</p>
      <button class="btn-main" id="start">${QUIZ.startButton}</button>
    </section>`;
  document.getElementById("start").onclick = () => go(1);
}


/* ---------- หน้าเหตุการณ์ ---------- */
function showStory(s) {
  app.innerHTML = `
    <section class="page story">
      ${s.image ? `<img class="story-img" src="${s.image}" alt="">` : `<div class="story-mark">✦</div>`}
      <p class="story-text">${s.text}</p>
      <button class="btn-main" id="next">${s.button}</button>
      <button class="btn-back" id="back">← ย้อนกลับ</button>
    </section>`;
  document.getElementById("next").onclick = () => go(1);
  document.getElementById("back").onclick = () => go(-1);
}


/* ---------- หน้าคำถาม ---------- */
function showQuestion(s) {
  const num = QUESTION_STEPS.indexOf(step) + 1;
  const total = QUESTION_STEPS.length;

  const buttons = order[step].map(ci =>
    `<button class="choice ${answers[step] === ci ? "picked" : ""}" data-ci="${ci}">${s.choices[ci].text}</button>`
  ).join("");

  app.innerHTML = `
    <section class="page">
      <div class="top">
        <button class="btn-back" id="back" aria-label="ย้อนกลับ">←</button>
        <div class="progress"><div class="progress-fill" style="width:${((num - 1) / total) * 100}%"></div></div>
        <span class="count">${num}/${total}</span>
      </div>
      ${s.image ? `<img class="q-image" src="${s.image}" alt="">` : ""}
      <p class="q-title">${s.title || ""}</p>
      <h2 class="question">${s.question}</h2>
      <div class="choices">${buttons}</div>
    </section>`;

  document.getElementById("back").onclick = () => go(-1);
  app.querySelectorAll(".choice").forEach(btn => {
    btn.onclick = () => {
      answers[step] = Number(btn.dataset.ci);
      btn.classList.add("picked");
      setTimeout(() => go(1), 250);
    };
  });
}


/* ---------- คิดคะแนน ---------- */
function calculate() {
  const totals = {}, max = {}, twos = {}, tie = {};
  CODES.forEach(c => { totals[c] = 0; max[c] = 0; twos[c] = 0; tie[c] = 0; });

  STEPS.forEach((s, i) => {
    if (s.type !== "question") return;

    // แต้มสูงสุดที่แต่ละภาคได้จากข้อนี้ (ใช้คิดเปอร์เซ็นต์)
    CODES.forEach(c => { max[c] += Math.max(0, ...s.choices.map(ch => ch.scores[c] || 0)); });

    if (answers[i] === undefined) return;
    const picked = s.choices[answers[i]].scores;
    for (const c in picked) {
      totals[c] += picked[c];
      if (picked[c] >= 2) twos[c] += 1;          // นับว่าได้ "แต้มหลัก" กี่ครั้ง
      if (s.tiebreak) tie[c] = picked[c];         // แต้มจากข้อตัดสินเสมอ
    }
  });

  // จัดอันดับ: แต้มรวม → ถ้าเสมอดูข้อตัดสิน → ดูจำนวนแต้มหลัก → ลำดับใน results.js
  const ranked = [...CODES].sort((a, b) =>
    totals[b] - totals[a] || tie[b] - tie[a] || twos[b] - twos[a] || CODES.indexOf(a) - CODES.indexOf(b)
  );

  // แกนนิสัย = ค่าเฉลี่ยของตำแหน่งภาค ถ่วงด้วยแต้มที่ได้
  const sum = CODES.reduce((t, c) => t + totals[c], 0) || 1;
  const axis = {};
  for (const a in AXES) {
    axis[a] = CODES.reduce((t, c) => t + totals[c] * (RESULTS[c].profile[a] || 0), 0) / sum;
  }

  const pct = {};
  CODES.forEach(c => { pct[c] = max[c] ? Math.round((totals[c] / max[c]) * 100) : 0; });

  return { totals, max, pct, ranked, axis, top3: ranked.slice(0, 3), worst: ranked[ranked.length - 1] };
}


/* ---------- หน้าสรุปผล ---------- */
function showResult() {
  const r = calculate();
  const win = RESULTS[r.top3[0]];

  app.innerHTML = `
    <section class="page result">
      <div class="char-card">
        ${win.image ? `<img class="char-img" src="${win.image}" alt="">` : `<div class="char-mark">✦</div>`}
        <p class="char-label">คลาสของคุณในดันเจี้ยน</p>
        <h1>${win.job}</h1>
        <p class="char-dept">${win.dept}</p>
        <p class="char-desc">${win.desc}</p>
      </div>

      <div class="block">
        <h3>แผนภาพความเป็นคุณ</h3>
        ${radarChart(r)}
      </div>

      <div class="block">
        <h3>ภาคที่เหมาะกับคุณ</h3>
        ${rankBars(r)}
        <p class="not-fit">ทางที่อาจยังไม่ใช่ตอนนี้: <b>${RESULTS[r.worst].dept}</b></p>
      </div>

      <div class="block">
        <h3>คุณเอนไปทางไหน</h3>
        ${axisBars(r.axis)}
      </div>

      <div class="block">
        <h3>นิสัยที่ออก้าเห็นในตัวคุณ</h3>
        <ul class="list">${win.traits.map(t => `<li>${t}</li>`).join("")}</ul>
      </div>

      <div class="block">
        <h3>ใน${win.dept} คุณจะได้เรียน</h3>
        <ul class="list">${win.learn.map(t => `<li>${t}</li>`).join("")}</ul>
      </div>

      <div class="block">
        <h3>สาขาย่อย</h3>
        <div class="tags">${win.majors.map(m => `<span class="tag">${m}</span>`).join("")}</div>
      </div>

      <details class="debug">
        <summary>ดูแต้มดิบทุกภาค</summary>
        <ul class="score-list">${r.ranked.map(c => `<li><span>${c} · ${RESULTS[c].dept}</span><b>${r.totals[c]} / ${r.max[c]}</b></li>`).join("")}</ul>
      </details>

      <button class="btn-main" id="again">เล่นอีกครั้ง</button>
    </section>`;
  document.getElementById("again").onclick = () => { step = -1; render(); };
}


/* ---------- แผนภาพ 8 เหลี่ยม ---------- */
function radarChart(r) {
  const size = 320, cx = 160, cy = 160, R = 110;
  const n = CODES.length;
  const point = (i, scale) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;           // เริ่มจากด้านบน วนตามเข็ม
    return [cx + Math.cos(angle) * R * scale, cy + Math.sin(angle) * R * scale];
  };

  // เส้นตาราง 3 ชั้น
  const grid = [1 / 3, 2 / 3, 1].map(k =>
    `<polygon points="${CODES.map((_, i) => point(i, k).join(",")).join(" ")}" class="radar-grid"/>`
  ).join("");
  const spokes = CODES.map((_, i) => {
    const [x, y] = point(i, 1);
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-grid"/>`;
  }).join("");

  // รูปของผู้เล่น
  const shape = CODES.map((c, i) => point(i, Math.max(r.pct[c], 3) / 100).join(",")).join(" ");
  const dots = CODES.map((c, i) => {
    const [x, y] = point(i, Math.max(r.pct[c], 3) / 100);
    return `<circle cx="${x}" cy="${y}" r="3.5" class="radar-dot"/>`;
  }).join("");

  // ชื่อภาครอบนอก
  const labels = CODES.map((c, i) => {
    const [x, y] = point(i, 1.22);
    const top = r.top3[0] === c ? "radar-label win" : "radar-label";
    return `<text x="${x}" y="${y}" class="${top}" text-anchor="middle" dominant-baseline="middle">${c}</text>`;
  }).join("");

  return `
    <svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="แผนภาพแต้มทั้ง 8 ภาค">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f08cbd"/><stop offset=".5" stop-color="#a98bf0"/><stop offset="1" stop-color="#7cc3f2"/>
        </linearGradient>
      </defs>
      ${grid}${spokes}
      <polygon points="${shape}" class="radar-shape"/>
      ${dots}${labels}
    </svg>`;
}


/* ---------- แถบ 3 อันดับ ---------- */
function rankBars(r) {
  return r.top3.map((c, i) => `
    <div class="rank">
      <span class="rank-no">${i + 1}</span>
      <div class="rank-body">
        <div class="rank-row"><span>${RESULTS[c].dept}</span><b>${r.pct[c]}%</b></div>
        <div class="bar"><i style="width:${r.pct[c]}%"></i></div>
      </div>
    </div>`).join("");
}


/* ---------- แกนนิสัย ---------- */
// แต่ละแกนแบ่ง 2 ขั้ว: แถบเติมจากฝั่งที่ชนะ ยาวตามเปอร์เซ็นต์ของฝั่งนั้น
const AXIS_COLORS = ["#4aa3b8", "#e0a43a", "#4fae8c", "#c98bb0"];

function axisBars(axis) {
  return Object.entries(AXES).map(([a, ax], i) => {
    const right = Math.round((axis[a] + 1) * 50);        // -1..+1 → 0..100%
    const left = 100 - right;
    const side = right > left ? "right" : "left";
    const win = Math.max(left, right);
    return `
      <div class="axis" style="--c:${AXIS_COLORS[i % AXIS_COLORS.length]}">
        <div class="axis-row">
          <span class="axis-pct ${side === "left" ? "hot" : ""}">${left}%</span>
          <div class="axis-track"><i class="from-${side}" style="width:${win}%"></i></div>
          <span class="axis-pct ${side === "right" ? "hot" : ""}">${right}%</span>
        </div>
        <div class="axis-ends">
          <span class="${side === "left" ? "hot" : ""}">${ax.left}</span>
          <span class="${side === "right" ? "hot" : ""}">${ax.right}</span>
        </div>
      </div>`;
  }).join("");
}


// เริ่มเกม
render();