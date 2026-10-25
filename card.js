/* ==========================================================
   card.js — การ์ดสรุปผลสำหรับดาวน์โหลด / แชร์
   ----------------------------------------------------------
   วาดลง <canvas> ขนาด 1080×1920 (สัดส่วน 9:16 เท่า Instagram / TikTok Story)
   เนื้อหาสำคัญอยู่ช่วงกลาง เว้นขอบบน-ล่างไว้ให้แถบชื่อและช่องตอบของแอป
   บนการ์ด: รูปคลาส / แผนภาพ 8 เหลี่ยม / 3 ภาคที่เหมาะ / แกนนิสัย / สาขาย่อยแนะนำ

   ใช้งาน: openCard(r)  — r คือผลจาก calculate() ใน script.js
   หมายเหตุ: ต้องเปิดเว็บผ่าน http(s) เช่น GitHub Pages หรือ Live Server
   ถ้าเปิดไฟล์ตรงๆ (file://) เบราว์เซอร์จะไม่ยอมให้บันทึกรูปจาก canvas
   ========================================================== */

const CARD = {
  w: 1080, h: 1920, pad: 60,
  font: '"Noto Sans Thai", sans-serif',
  ink: "#2e2640", soft: "#7a7290", line: "#e7dff0", panel: "#fffdf9", accent: "#a98bf0",
  grad: ["#f08cbd", "#a98bf0", "#7cc3f2"],
  bg: ["#fbe6f1", "#efe8fd", "#e2f1fc"]
};


/* ---------- เครื่องมือวาด ---------- */
function cardFont(ctx, size, weight = 400) {
  ctx.font = `${weight} ${size}px ${CARD.font}`;
}

function gradientX(ctx, x, w) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  CARD.grad.forEach((c, i) => g.addColorStop(i / (CARD.grad.length - 1), c));
  return g;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ตัดบรรทัดภาษาไทย (ไม่มีช่องว่างระหว่างคำ) ด้วยตัวแบ่งคำของเบราว์เซอร์
function wrapText(ctx, text, maxW) {
  const parts = window.Intl && Intl.Segmenter
    ? [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map(s => s.segment)
    : [...text];
  const lines = [];
  let line = "";
  for (const p of parts) {
    if (line && ctx.measureText(line + p).width > maxW) { lines.push(line.trimEnd()); line = p.trimStart(); }
    else line += p;
  }
  if (line) lines.push(line);
  return lines;
}

// เขียนข้อความหลายบรรทัด คืนค่าความสูงที่ใช้ (dry = วัดอย่างเดียวไม่วาด)
function drawLines(ctx, text, x, y, maxW, lh, dry, align = "left") {
  const lines = wrapText(ctx, text, maxW);
  if (!dry) {
    ctx.textAlign = align;
    lines.forEach((l, i) => ctx.fillText(l, align === "right" ? x + maxW : x, y + i * lh));
    ctx.textAlign = "left";
  }
  return lines.length * lh;
}

// กล่องพื้นขาว: วัดความสูงของเนื้อหาก่อน แล้วค่อยวาดพื้นและเนื้อหา
function panel(ctx, y, body, dry) {
  const x = CARD.pad, w = CARD.w - CARD.pad * 2, p = 34;
  const h = body(x + p, y + p, w - p * 2, true) + p * 2;
  if (dry) return h;
  ctx.save();
  ctx.shadowColor = "rgba(46, 38, 64, 0.08)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  roundRect(ctx, x, y, w, h, 40);
  ctx.fillStyle = CARD.panel; ctx.fill();
  ctx.restore();
  body(x + p, y + p, w - p * 2, false);
  return h;
}

function heading(ctx, text, x, y, w, dry) {
  if (!dry) {
    cardFont(ctx, 26, 600); ctx.fillStyle = CARD.soft;
    ctx.textBaseline = "top"; ctx.fillText(text, x, y);
    ctx.fillStyle = CARD.line; ctx.fillRect(x, y + 46, w, 2);
  }
  return 64;
}

function loadImage(src) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
}


/* ---------- ส่วนต่างๆ ของการ์ด ---------- */
function cardHero(ctx, win, img, x, y, w, dry) {
  const size = 340, tx = x + size + 30, tw = w - size - 30;
  const [en, th] = win.job.split(" · ");
  ctx.textBaseline = "top";

  let h = 20;
  cardFont(ctx, 28, 400); ctx.fillStyle = CARD.soft;
  if (!dry) ctx.fillText("คลาสของฉันในดันเจี้ยน", tx, y + h);
  h += 50;
  cardFont(ctx, 60, 700); ctx.fillStyle = CARD.ink;
  h += drawLines(ctx, en, tx, y + h, tw, 76, dry);
  if (th) { cardFont(ctx, 40, 600); h += drawLines(ctx, th, tx, y + h, tw, 58, dry) + 14; }
  cardFont(ctx, 30, 600); ctx.fillStyle = CARD.accent;
  h += drawLines(ctx, win.dept, tx, y + h, tw, 44, dry);

  if (!dry && img) ctx.drawImage(img, x - 10, y, size, size);
  return Math.max(size, h);
}

function cardRadar(ctx, r, cx, cy, R) {
  const n = CODES.length;
  const pt = (i, k) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k];
  };
  const poly = (k) => { ctx.beginPath(); CODES.forEach((c, i) => ctx[i ? "lineTo" : "moveTo"](...pt(i, typeof k === "function" ? k(c) : k))); ctx.closePath(); };

  ctx.strokeStyle = CARD.line; ctx.lineWidth = 2;
  [1 / 3, 2 / 3, 1].forEach(k => { poly(k); ctx.stroke(); });
  CODES.forEach((_, i) => { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(...pt(i, 1)); ctx.stroke(); });

  const scale = c => Math.max(r.pct[c], 3) / 100;
  poly(scale);
  ctx.globalAlpha = 0.35; ctx.fillStyle = gradientX(ctx, cx - R, R * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = gradientX(ctx, cx - R, R * 2); ctx.lineWidth = 4; ctx.lineJoin = "round"; ctx.stroke();

  ctx.fillStyle = CARD.accent;
  CODES.forEach((c, i) => { ctx.beginPath(); ctx.arc(...pt(i, scale(c)), 6, 0, Math.PI * 2); ctx.fill(); });

  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  CODES.forEach((c, i) => {
    const win = r.top3[0] === c;
    cardFont(ctx, 24, win ? 700 : 500); ctx.fillStyle = win ? CARD.ink : CARD.soft;
    ctx.fillText(c, ...pt(i, 1.2));
  });
  ctx.textAlign = "left"; ctx.textBaseline = "top";
}

function cardGraphs(ctx, r, x, y, w, dry) {
  const half = (w - 30) / 2;
  let h = heading(ctx, "แผนภาพความเป็นฉัน", x, y, half, dry);
  const R = 125;
  if (!dry) cardRadar(ctx, r, x + half / 2, y + h + R + 36, R);
  const left = h + R * 2 + 72;

  // ฝั่งขวา: 3 ภาคที่เหมาะ (กราฟแท่ง)
  const rx = x + half + 30;
  let rh = heading(ctx, "ภาคที่เหมาะกับฉัน", rx, y, half, dry);
  r.top3.forEach((c, i) => {
    const pct = r.pct[c];
    cardFont(ctx, 26, i ? 500 : 700); ctx.fillStyle = CARD.ink; ctx.textBaseline = "top";
    const lh = drawLines(ctx, `${i + 1}. ${RESULTS[c].dept}`, rx, y + rh, half - 80, 36, dry);
    if (!dry) {
      cardFont(ctx, 26, 700); ctx.textAlign = "right"; ctx.fillText(`${pct}%`, rx + half, y + rh); ctx.textAlign = "left";
      roundRect(ctx, rx, y + rh + lh + 6, half, 12, 6); ctx.fillStyle = CARD.line; ctx.fill();
      roundRect(ctx, rx, y + rh + lh + 6, Math.max(half * pct / 100, 12), 12, 6); ctx.fillStyle = gradientX(ctx, rx, half); ctx.fill();
    }
    rh += lh + 44;
  });
  return Math.max(left, rh);
}

function cardAxes(ctx, r, x, y, w, dry) {
  let h = heading(ctx, "ฉันเอนไปทางไหน", x, y, w, dry);
  Object.entries(AXES).forEach(([a, ax], i) => {
    const c = AXIS_COLORS[i % AXIS_COLORS.length];
    const right = Math.round((r.axis[a] + 1) * 50), left = 100 - right;
    const side = right > left ? "right" : "left", win = Math.max(left, right);
    if (!dry) {
      const tx = x + 90, tw = w - 180, ty = y + h + 6;
      ctx.textBaseline = "top";
      cardFont(ctx, 26, side === "left" ? 700 : 400); ctx.fillStyle = side === "left" ? c : CARD.soft;
      ctx.fillText(`${left}%`, x, y + h - 8);
      cardFont(ctx, 26, side === "right" ? 700 : 400); ctx.fillStyle = side === "right" ? c : CARD.soft;
      ctx.textAlign = "right"; ctx.fillText(`${right}%`, x + w, y + h - 8); ctx.textAlign = "left";

      roundRect(ctx, tx, ty, tw, 14, 7); ctx.fillStyle = CARD.line; ctx.fill();
      const fw = tw * win / 100, fx = side === "left" ? tx : tx + tw - fw;
      roundRect(ctx, fx, ty, fw, 14, 7); ctx.fillStyle = c; ctx.fill();
      const dx = side === "left" ? tx + fw : fx;
      ctx.beginPath(); ctx.arc(dx, ty + 7, 13, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = c; ctx.stroke();

      cardFont(ctx, 22, 500);
      ctx.fillStyle = side === "left" ? c : CARD.soft; ctx.fillText(ax.left, x, y + h + 36);
      ctx.fillStyle = side === "right" ? c : CARD.soft;
      ctx.textAlign = "right"; ctx.fillText(ax.right, x + w, y + h + 36); ctx.textAlign = "left";
    }
    h += 84;
  });
  return h - 16;
}

function cardMajors(ctx, win, x, y, w, dry) {
  let h = heading(ctx, `สาขาที่แนะนำใน${win.dept}`, x, y, w, dry);
  cardFont(ctx, 24, 500); ctx.textBaseline = "middle";
  let tx = x, row = 0;
  win.majors.forEach(m => {
    const tw = ctx.measureText(m).width + 40;
    if (tx + tw > x + w && tx > x) { tx = x; row++; }
    if (!dry) {
      const ty = y + h + row * 62;
      roundRect(ctx, tx, ty, tw, 48, 24); ctx.fillStyle = "#f8f3ea"; ctx.fill();
      ctx.strokeStyle = CARD.line; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = CARD.ink; ctx.fillText(m, tx + 20, ty + 25);
    }
    tx += tw + 12;
  });
  ctx.textBaseline = "top";
  return h + (row + 1) * 62 - 14;
}


/* ---------- วาดการ์ดทั้งใบ ---------- */
async function drawCard(r) {
  const win = RESULTS[r.top3[0]];
  await Promise.all([400, 500, 600, 700].map(wt => document.fonts.load(`${wt} 32px ${CARD.font}`, "กขabc")));
  const img = win.image ? await loadImage(win.image).catch(() => null) : null;

  const cv = document.createElement("canvas");
  cv.width = CARD.w; cv.height = CARD.h;
  const ctx = cv.getContext("2d");

  // พื้นหลังไล่สี + ดาวประดับ
  const bg = ctx.createLinearGradient(0, 0, CARD.w, CARD.h);
  CARD.bg.forEach((c, i) => bg.addColorStop(i / (CARD.bg.length - 1), c));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CARD.w, CARD.h);
  ctx.fillStyle = "rgba(169, 139, 240, 0.35)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  [[90, 110, 44], [990, 160, 30], [960, 1830, 40], [120, 1800, 28]].forEach(([sx, sy, s]) => {
    cardFont(ctx, s, 400); ctx.fillText("✦", sx, sy);
  });

  // หัวการ์ด (อยู่ในโซนบนที่แอปอาจบัง จึงใส่แค่ชื่อเกม)
  cardFont(ctx, 32, 600); ctx.fillStyle = CARD.soft;
  ctx.fillText(QUIZ.title, CARD.w / 2, 150);
  ctx.textAlign = "left"; ctx.textBaseline = "top";

  // เนื้อหาหลัก เรียงจากบนลงล่าง (วัดความสูงก่อน ถ้าล้นพื้นที่ให้ย่อทั้งก้อนลงพอดี)
  const top = 200, bottom = 1790, gap = 20;
  const content = (dry) => {
    let y = 0;
    y += panel(ctx, y, (x, yy, w, d) => cardHero(ctx, win, img, x, yy, w, d), dry) + gap;
    y += panel(ctx, y, (x, yy, w, d) => cardGraphs(ctx, r, x, yy, w, d), dry) + gap;
    y += panel(ctx, y, (x, yy, w, d) => cardAxes(ctx, r, x, yy, w, d), dry) + gap;
    y += panel(ctx, y, (x, yy, w, d) => cardMajors(ctx, win, x, yy, w, d), dry);
    return y;
  };
  const total = content(true);
  const k = Math.min(1, (bottom - top) / total);
  ctx.save();
  ctx.translate((CARD.w * (1 - k)) / 2, top);
  ctx.scale(k, k);
  content(false);
  ctx.restore();

  // ท้ายการ์ด
  cardFont(ctx, 26, 500); ctx.fillStyle = CARD.soft; ctx.textAlign = "center";
  ctx.fillText("มาหาคลาสของคุณในดันเจี้ยนกัน ✦", CARD.w / 2, top + total * k + 60);
  ctx.textAlign = "left";
  return cv;
}


/* ---------- หน้าต่างแสดงการ์ด + ปุ่มบันทึก ---------- */
async function openCard(r) {
  const box = document.createElement("div");
  box.className = "card-modal";
  box.innerHTML = `<div class="card-sheet"><p class="card-wait">กำลังสร้างการ์ด…</p></div>`;
  document.body.appendChild(box);
  const close = () => box.remove();
  box.onclick = e => { if (e.target === box) close(); };

  let blob, url;
  try {
    const cv = await drawCard(r);
    blob = await new Promise((ok, fail) => cv.toBlob(b => (b ? ok(b) : fail()), "image/png"));
    url = URL.createObjectURL(blob);
  } catch (err) {
    console.error(err);
    box.querySelector(".card-sheet").innerHTML = `
      <p class="card-wait">สร้างการ์ดไม่สำเร็จ${location.protocol === "file:" ? "<br><small>ต้องเปิดเว็บผ่านเว็บเซิร์ฟเวอร์ (http/https) ไม่ใช่เปิดไฟล์ตรงๆ</small>" : ""}</p>
      <button class="btn-main" id="card-close">ปิด</button>`;
    box.querySelector("#card-close").onclick = close;
    return;
  }

  const name = `my-dungeon-class-${r.top3[0]}.png`;
  box.querySelector(".card-sheet").innerHTML = `
    <img class="card-preview" src="${url}" alt="การ์ดผลลัพธ์">
    <p class="card-hint">บนมือถือกดค้างที่รูปเพื่อบันทึกได้เหมือนกัน</p>
    <div class="card-actions">
      <button class="btn-ghost" id="card-close">ปิด</button>
      <button class="btn-main" id="card-save">บันทึกการ์ด</button>
    </div>`;
  box.querySelector("#card-close").onclick = () => { URL.revokeObjectURL(url); close(); };
  box.querySelector("#card-save").onclick = async () => {
    // มือถือ: เปิดหน้าแชร์ของเครื่อง (บันทึกลงอัลบั้ม / ส่งเข้า IG ได้) / คอม: ดาวน์โหลดไฟล์
    const file = new File([blob], name, { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: QUIZ.title }); return; }
      catch (e) { if (e.name === "AbortError") return; }
    }
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  };
}
