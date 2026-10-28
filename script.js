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
   หน้า:  showHome() หน้าแรก เลือกเวอร์ชัน / showDepts() ข้อมูลทุกภาค
          showDocs() อ่านไฟล์ PDF / showCredits() เครดิตและหมายเหตุ (เนื้อหาอยู่ใน pages.js)
          showStart() / showStory(s) / showQuestion(s) / showResult() ในเกม
   คะแนน: calculate()
   กราฟ:  radarChart() แผนภาพ 8 เหลี่ยม / rankBars() 3 อันดับ / axisBars() แกนนิสัย
   ========================================================== */

const app = document.getElementById("app");
const CODES = Object.keys(RESULTS);          // ลำดับภาคตาม results.js

// เกมแต่ละเวอร์ชัน: quiz = ชื่อ/ปุ่มเริ่ม, steps = หน้าเหตุการณ์และคำถาม
// เพิ่มเวอร์ชันใหม่ได้โดยสร้างไฟล์คำถามแบบเดียวกัน แล้วเพิ่มบรรทัดในนี้ + ใส่ <script> ใน index.html
const GAMES = {
  story: { quiz: QUIZ, steps: STEPS, label: "Version 1", note: "มีเนื้อเรื่อง 10 คำถาม · ประมาณ 5–7 นาที" },
  quick: { quiz: QUIZ_QUICK, steps: STEPS_QUICK, label: "Version 2", note: "เนื้อเรื่องคริสตัลดาว 8 คำถาม · 5-7 นาที" }
};

let view = "home";      // "home" หน้าแรก / "depts" ข้อมูลภาค / "docs" เอกสาร / "credits" เครดิต / "game" กำลังเล่น
let game = GAMES.story; // เวอร์ชันที่กำลังเล่น
let steps = game.steps;
let step = -1;          // -1 = หน้าเริ่มของเวอร์ชันนั้น, steps.length = หน้าผล
let answers = {};       // answers[ลำดับหน้า] = ตัวเลือกที่เลือก (เลขเดิมในไฟล์คำถาม)
let order = {};         // ลำดับตัวเลือกที่สุ่มแล้วของแต่ละข้อ
let docIndex = 0;       // เอกสารที่กำลังเปิดอ่านในหน้า "เอกสาร"

// ลำดับหน้าคำถามทั้งหมดของเวอร์ชันที่เล่น ไว้ทำแถบความคืบหน้า "ข้อ 3/10"
let QUESTION_STEPS = [];

function selectGame(key) {
  game = GAMES[key];
  steps = game.steps;
  QUESTION_STEPS = steps.map((s, i) => (s.type === "question" ? i : -1)).filter(i => i >= 0);
  view = "game";
  step = -1;
  render();
  window.scrollTo(0, 0);
}

function goHome() { goTo("home"); }

// ไปหน้าจากเมนูด้านบน ถ้ากำลังเล่นอยู่กลางเกมให้ถามก่อน เพราะคำตอบจะหาย
function goTo(v) {
  const playing = view === "game" && step >= 0 && step < steps.length && Object.keys(answers).length > 0;
  if (playing && v !== "game" && !confirm("ออกจากเกม? คำตอบที่เลือกไว้จะหายไป")) return;
  view = v;
  render();
  window.scrollTo(0, 0);
}


/* ---------- ตัวเปลี่ยนหน้า ---------- */
function go(delta) {
  step += delta;
  render();
  window.scrollTo(0, 0);
}

function render() {
  // ไฮไลต์เมนูของหน้าที่เปิดอยู่
  document.querySelectorAll(".nav-links [data-view]").forEach(b => {
    if (b.dataset.view === view) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (view === "home") return showHome();
  if (view === "depts") return showDepts();
  if (view === "docs") return showDocs();
  if (view === "credits") return showCredits();
  if (step < 0) return showStart();
  if (step >= steps.length) return showResult();
  const s = steps[step];
  if (s.type === "story") showStory(s);
  else showQuestion(s);
}


/* ---------- หน้าแรก: เลือกเวอร์ชันเกม / ดูข้อมูลภาค ---------- */
function showHome() {
  const versions = Object.entries(GAMES).map(([key, g]) => `
    <button class="version" data-game="${key}">
      <span class="version-label">${g.label}</span>
      <span class="version-title">${g.quiz.title}</span>
      <span class="version-note">${g.note}</span>
    </button>`).join("");

  app.innerHTML = `
    <section class="page screen">
      <div class="top"></div>
      <div class="middle">
        <h1>ภาคไหนที่ใช่คุณ</h1>
        <p class="subtitle">ลองทำแบบทดสอบ แล้วดูว่าคุณเหมาะกับภาคไหนใน SIIT</p>
        <div class="versions">${versions}</div>
      </div>
    </section>`;
  app.querySelectorAll(".version").forEach(btn => { btn.onclick = () => selectGame(btn.dataset.game); });
}


/* ---------- หน้ารวมข้อมูลภาค ---------- */
function showDepts() {
  const cards = CODES.map(c => {
    const d = RESULTS[c];
    return `
      <article class="block dept">
        <div class="dept-head">
          ${d.image ? `<img class="dept-img" src="${d.image}" alt="">` : `<div class="dept-img dept-mark">✦</div>`}
          <div>
            <p class="dept-code">${c}</p>
            <h2 class="dept-name">${d.dept}</h2>
            <p class="dept-job">${d.job}</p>
          </div>
        </div>
        <p class="dept-desc">${d.about}</p>
        <h3>จะได้เรียน</h3>
        <ul class="list">${d.learn.map(t => `<li>${t}</li>`).join("")}</ul>
        ${d.majors && d.majors.length ? `
        <h3>สาขาย่อย</h3>
        <div class="tags">${d.majors.map(m => `<span class="tag">${m}</span>`).join("")}</div>` : ""}
      </article>`;
  }).join("");

  app.innerHTML = `
    <section class="page depts">
      <h1 class="page-title">ข้อมูลทุกภาค</h1>
      ${cards}
      <button class="btn-main" id="play">ทำ quiz หาภาคที่ใช่</button>
    </section>`;
  document.getElementById("play").onclick = goHome;
}


/* ---------- หน้าเอกสาร: รายชื่อเอกสาร + รูปของเอกสารที่เลือก เรียงลงมาทีละหน้า ---------- */
function showDocs() {
  if (!DOCS.length) {
    app.innerHTML = `
      <section class="page docs">
        <h1 class="page-title">เอกสาร</h1>
        <p class="empty">ยังไม่มีเอกสาร</p>
      </section>`;
    return;
  }
  if (docIndex >= DOCS.length) docIndex = 0;
  const doc = DOCS[docIndex];
  const list = DOCS.map((d, i) => `
    <button class="doc-item" data-i="${i}" ${i === docIndex ? 'aria-current="true"' : ""}>
      <span class="doc-title">${d.title}</span>
      ${d.note ? `<span class="doc-note">${d.note}</span>` : ""}
    </button>`).join("");

  app.innerHTML = `
    <section class="page docs">
      <h1 class="page-title">เอกสาร</h1>
      ${DOCS.length > 1 ? `<div class="doc-list">${list}</div>` : ""}
      <div class="doc-viewer">
        <div class="doc-bar"><span class="doc-title">${doc.title}</span></div>
        <div class="doc-pages">${(doc.images || []).map((src, i) => `
          <a href="${encodeURI(src)}" target="_blank" rel="noopener">
            <img class="doc-page" src="${encodeURI(src)}" alt="${doc.title} หน้า ${i + 1}" loading="lazy">
          </a>`).join("")}
        </div>
      </div>
    </section>`;
  app.querySelectorAll(".doc-item").forEach(btn => {
    btn.onclick = () => { docIndex = Number(btn.dataset.i); showDocs(); };
  });
}


/* ---------- หน้าเครดิตและหมายเหตุ ---------- */
const INSTAGRAM_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/></svg>`;

function showCredits() {
  const body = CREDITS.length
    ? `<article class="block">${CREDITS.map(t => `<p>${t}</p>`).join("")}</article>`
    : `<p class="empty">ยังไม่มีข้อมูล</p>`;
  const ig = typeof INSTAGRAM !== "undefined" && INSTAGRAM ? `
      <a class="social-link" href="${INSTAGRAM.url}" target="_blank" rel="noopener" aria-label="Instagram ${INSTAGRAM.name}">
        ${INSTAGRAM_ICON}<span>${INSTAGRAM.name}</span>
      </a>` : "";
  app.innerHTML = `
    <section class="page credits">
      <h1 class="page-title">เครดิต</h1>
      ${body}
      ${ig}
    </section>`;
}

/* ----- สุ่มลำดับคำตอบ
function shuffle(n) {
  const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
*/
/* ---------- ไอเทมที่ผู้เล่นเลือกไว้ ---------- */
function pickedItem() {
  const i = steps.findIndex(s => s.layout === "inventory");   // หาข้อเลือกไอเทม (ในเวอร์ชันที่กำลังเล่น)
  if (i < 0 || answers[i] === undefined) return null;
  return steps[i].choices[answers[i]];
}

// แทน {item} ในข้อความด้วยชื่อไอเทมที่เลือก
function fill(text) {
  const item = pickedItem();
  return text.replace(/\{item\}/g, item ? item.name : "ของติดตัว");
}

/* ---------- หน้าแรก ---------- */
function showStart() {
  answers = {};
  order = {};
  steps.forEach((s, i) => { if (s.type === "question") order[i] = s.choices.map((_, k) => k); });
  const quiz = game.quiz;

  // ทุกหน้าแบ่งเป็น 3 ช่องตำแหน่งคงที่: แถบบน / เนื้อหากลางจอ / ปุ่มล่าง
  app.innerHTML = `
    <section class="page screen">
      <div class="top"><button class="btn-back" id="back" aria-label="กลับหน้าแรก">←</button></div>
      <div class="middle">
        ${quiz.coverImage ? `<img class="cover" src="${quiz.coverImage}" alt="">` : ""}
        <h1>${quiz.title}</h1>
        <p class="subtitle">${quiz.subtitle}</p>
      </div>
      <div class="bottom"><button class="btn-main" id="start">${quiz.startButton}</button></div>
    </section>`;
  document.getElementById("start").onclick = () => go(1);
  document.getElementById("back").onclick = goHome;
}


/* ---------- แถบบน: ปุ่มย้อนกลับ (ซ้ายสุด) + แถบความคืบหน้า ---------- */
function topBar() {
  const total = QUESTION_STEPS.length;
  const done = QUESTION_STEPS.filter(i => i < step).length;      // ข้อที่ผ่านมาแล้ว
  const isQuestion = steps[step].type === "question";
  return `
    <div class="top">
      <button class="btn-back" id="back" aria-label="ย้อนกลับ">←</button>
      <div class="progress"><div class="progress-fill" style="width:${(done / total) * 100}%"></div></div>
      <span class="count">${isQuestion ? `${done + 1}/${total}` : ""}</span>
    </div>`;
}


/* ---------- หน้าเหตุการณ์ ---------- */
function showStory(s) {
  // แถบบนหน้าตาเดียวกับหน้าคำถาม (ปุ่มย้อนกลับอยู่ตำแหน่งเดียวกัน) ส่วนเนื้อเรื่อง + ปุ่มไปต่ออยู่กลางจอ
  app.innerHTML = `
    <section class="page screen">
      ${topBar()}
      <div class="middle">
        ${s.image ? `<img class="story-img" src="${s.image}" alt="">` : `<div class="story-mark">✦</div>`}
        <p class="story-text">${fill(s.text)}</p>
        <button class="btn-main" id="next">${s.button}</button>
      </div>
      <div class="bottom"></div>
    </section>`;
  document.getElementById("next").onclick = () => go(1);
  document.getElementById("back").onclick = () => go(-1);
}

/* ---------- หน้าคั่นหลังเลือกคำตอบ ---------- */
function showReaction(choice) {
  app.innerHTML = `
    <section class="page screen">
      ${topBar()}
      <div class="middle">
        ${choice.reactionImage ? `<img class="story-img" src="${choice.reactionImage}" alt="">` : `<div class="story-mark">✦</div>`}
        <p class="story-text">${fill(choice.reaction)}</p>
        <button class="btn-main" id="next">${choice.reactionButton || "ไปต่อ"}</button>
      </div>
      <div class="bottom"></div>
    </section>`;

  document.getElementById("next").onclick = () => go(1);   // ไปหน้าถัดไปใน STEPS
  document.getElementById("back").onclick = () => render(); // กลับไปหน้าคำถามเดิม
}

/* ---------- หน้าคำถาม ---------- */
function showQuestion(s) {
  // layout: "inventory" = การ์ดไอเทม รูปซ้าย + ชื่อและคำอธิบายขวา (ถ้ายังไม่มีรูป หรือโหลดไม่ได้ จะขึ้น ✦ แทน)
  const isInv = s.layout === "inventory";
  const buttons = order[step].map(ci => {
    const c = s.choices[ci];
    const picked = answers[step] === ci ? "picked" : "";
    if (isInv) return `
      <button class="choice item ${picked}" data-ci="${ci}">
        <span class="item-pic">${c.image
          ? `<img src="${c.image}" alt="" onerror="this.parentNode.textContent='✦'">`
          : "✦"}</span>
        <span class="item-body">
          <span class="item-name">${c.name || ""}</span>
          <span class="item-desc">${fill(c.text)}</span>
        </span>
      </button>`;
    return `<button class="choice ${picked}" data-ci="${ci}">${c.name ? `<b>${c.name}</b> ` : ""}${fill(c.text)}</button>`;
  }).join("");

  // หน้าคำถามไม่มีปุ่มล่าง (กดตัวเลือกแล้วไปต่อเลย) แต่เว้นช่องไว้ให้ตำแหน่งเท่ากับหน้าอื่น
  app.innerHTML = `
    <section class="page screen">
      ${topBar()}
      <div class="middle">
        ${s.image ? `<img class="q-image" src="${s.image}" alt="">` : ""}
        <p class="q-title">${s.title || ""}</p>
        ${s.story ? `<p class="q-story">${fill(s.story)}</p>` : ""}
        <h2 class="question">${fill(s.question)}</h2>
        <div class="choices">${buttons}</div>
      </div>
      <div class="bottom"></div>
    </section>`;

  document.getElementById("back").onclick = () => go(-1);
  app.querySelectorAll(".choice").forEach(btn => {
    btn.onclick = () => {
      const ci = Number(btn.dataset.ci);
      answers[step] = ci;
      btn.classList.add("picked");

      const choice = s.choices[ci];
      setTimeout(() => {
        if (choice.reaction) showReaction(choice);   // มีข้อความต่อเนื่อง: แสดงหน้าคั่นก่อน
        else go(1);                                  // ไม่มี: ไปหน้าถัดไปเลย
      }, 250);
    };
  });
}


/* ---------- คิดคะแนน ---------- */
function calculate() {
  const totals = {}, max = {}, twos = {}, tie = {};
  CODES.forEach(c => { totals[c] = 0; max[c] = 0; twos[c] = 0; tie[c] = 0; });

  steps.forEach((s, i) => {
    if (s.type !== "question") return;

    // แต้มสูงสุดที่แต่ละภาคได้จากข้อนี้ (ใช้คิดเปอร์เซ็นต์)
    CODES.forEach(c => { max[c] += Math.max(0, ...s.choices.map(ch => (ch.scores || {})[c] || 0)); });

    if (answers[i] === undefined) return;
    const picked = s.choices[answers[i]].scores || {};   // ตัวเลือกที่ไม่มี scores = ไม่ให้แต้ม
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

      <div class="result-actions">
        <button class="btn-main" id="card">บันทึกการ์ดผลลัพธ์</button>
        <button class="btn-ghost" id="again">เล่นอีกครั้ง</button>
        <button class="btn-ghost" id="home">กลับหน้าแรก</button>
      </div>
    </section>`;
  document.getElementById("card").onclick = () => openCard(r);
  document.getElementById("again").onclick = () => { step = -1; render(); window.scrollTo(0, 0); };
  document.getElementById("home").onclick = goHome;
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

/* ---------- ปุ่มเปลี่ยนธีมสว่าง/มืด ----------
   ยังไม่เคยกด = ตามโหมดของเครื่อง / กดแล้ว = จำค่าที่เลือกไว้ (localStorage)
   ไอคอนบอกว่ากดแล้วจะไปธีมไหน: ธีมสว่างโชว์พระจันทร์ ธีมมืดโชว์ดวงอาทิตย์ */
const THEME_ICONS = {
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`
};
const systemDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function currentTheme() {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return systemDark && systemDark.matches ? "dark" : "light";
}

function updateThemeButton() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  const dark = currentTheme() === "dark";
  btn.innerHTML = dark ? THEME_ICONS.sun : THEME_ICONS.moon;
  btn.setAttribute("aria-label", dark ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด");
  btn.title = btn.getAttribute("aria-label");
}

function toggleTheme() {
  const next = currentTheme() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
  updateThemeButton();
}

document.getElementById("theme-toggle").onclick = toggleTheme;
document.querySelectorAll(".navbar [data-view]").forEach(b => { b.onclick = () => goTo(b.dataset.view); });
// ถ้ายังไม่เคยเลือกเอง แล้วเครื่องเปลี่ยนโหมด ให้ไอคอนเปลี่ยนตาม
if (systemDark) systemDark.addEventListener("change", updateThemeButton);
updateThemeButton();

// เริ่มเกม
render();