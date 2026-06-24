/* =====================================================================
   内管マスター — アプリ本体
   画面遷移 / 学習ビュー / クイズ / 効果音(WebAudio) / 演出 / 保存
   ===================================================================== */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const UNITS = STUDY_DATA.units;

  /* ---------------- 保存データ ---------------- */
  const SAVE_KEY = "naikan-master-v1";
  const save = {
    xp: 0,
    answered: 0,
    correct: 0,
    bestStreak: 0,
    clears: {}, // unitId -> true
    wrong: [], // [{unitId, qIndex}]
    sound: true,
  };
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      Object.assign(save, d);
      if (!Array.isArray(save.wrong)) save.wrong = [];
      if (!save.clears) save.clears = {};
    } catch (e) {}
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  /* ---------------- レベル ---------------- */
  const TITLES = [
    [0, "見習い"], [3, "新人管理者"], [6, "営業所の番人"],
    [10, "コンプラ番長"], [15, "内部統制マスター"], [22, "金商法の賢者"], [30, "内管レジェンド"],
  ];
  function xpForLevel(lv) { return Math.floor(80 + (lv - 1) * 55 + Math.pow(lv - 1, 2) * 6); }
  function levelInfo() {
    let lv = 1, rem = save.xp;
    while (rem >= xpForLevel(lv)) { rem -= xpForLevel(lv); lv++; }
    return { lv, cur: rem, need: xpForLevel(lv) };
  }
  function titleFor(lv) { let t = TITLES[0][1]; for (const [n, s] of TITLES) if (lv >= n) t = s; return t; }

  /* ---------------- 効果音（WebAudio・素材不要） ---------------- */
  let actx = null;
  function ac() {
    if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }
  function tone(freq, t0, dur, type, gain) {
    const c = ac(); if (!c || !save.sound) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    o.connect(g); g.connect(c.destination);
    const t = c.currentTime + t0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const SND = {
    tap() { tone(420, 0, 0.07, "triangle", 0.12); },
    select() { tone(620, 0, 0.08, "square", 0.08); },
    correct() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.18, "triangle", 0.16)); },
    wrong() { tone(180, 0, 0.18, "sawtooth", 0.16); tone(120, 0.12, 0.22, "sawtooth", 0.14); },
    combo(n) { const base = 600 + Math.min(n, 12) * 70; tone(base, 0, 0.1, "square", 0.12); tone(base * 1.5, 0.06, 0.12, "square", 0.1); },
    levelup() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.08, 0.25, "triangle", 0.18)); },
    finish() { [523, 659, 784, 1047, 880, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.3, "triangle", 0.17)); },
    swipe() { tone(700, 0, 0.05, "sine", 0.06); },
  };

  /* ---------------- 演出（紙吹雪 / フラッシュ / トースト） ---------------- */
  const canvas = $("#fxCanvas"), ctx = canvas.getContext("2d");
  let parts = [], raf = null;
  function fitCanvas() { canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener("resize", fitCanvas); fitCanvas();
  const COLORS = ["#ff5fa2", "#ffd34d", "#7c5cff", "#22d39a", "#7cf0ff", "#ff8a4c"];
  function confetti(n, power) {
    n = n || 36;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 80,
        y: innerHeight * 0.4,
        vx: (Math.random() - 0.5) * (power || 9),
        vy: -Math.random() * (power || 9) - 4,
        g: 0.28 + Math.random() * 0.15,
        s: 6 + Math.random() * 7,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        c: COLORS[(Math.random() * COLORS.length) | 0], life: 1,
      });
    }
    if (!raf) tick();
  }
  function burst(x, y) {
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14;
      parts.push({ x, y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, g: 0.2, s: 5 + Math.random() * 4, rot: 0, vr: 0.2, c: COLORS[(Math.random() * COLORS.length) | 0], life: 1 });
    }
    if (!raf) tick();
  }
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.006;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(tick); else { raf = null; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }
  function flash(color) {
    const f = document.createElement("div");
    f.className = "flash"; f.style.background = color || "rgba(34,211,154,.4)";
    document.body.appendChild(f); requestAnimationFrame(() => f.classList.add("go"));
    setTimeout(() => f.remove(), 420);
  }
  let toastT = null;
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 1600);
  }
  function vibrate(ms) { if (navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }

  /* ---------------- 画面遷移 ---------------- */
  let current = "home";
  function go(name) {
    const cur = $(".screen.active"); const next = $("#screen-" + name);
    if (!next || cur === next) return;
    if (cur) cur.classList.remove("active");
    next.classList.add("active"); next.scrollTop = 0; current = name;
    SND.swipe();
    if (name === "home") renderHome();
    if (name === "units") renderUnits();
    if (name === "testconf") renderTestConf();
    if (name === "review") startReview();
  }
  // データ属性のナビ
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go]");
    if (t) { SND.tap(); go(t.getAttribute("data-go")); }
  });

  /* ---------------- ホーム ---------------- */
  function renderHome() {
    const li = levelInfo();
    $("#lvBadge").textContent = "Lv." + li.lv;
    $("#lvTitle").textContent = titleFor(li.lv);
    $("#lvXpText").textContent = `${li.cur} / ${li.need} XP`;
    $("#xpFill").style.width = Math.min(100, (li.cur / li.need) * 100) + "%";
    $("#statStreak").textContent = save.bestStreak;
    $("#statAcc").textContent = save.answered ? Math.round((save.correct / save.answered) * 100) + "%" : "—";
    $("#statClear").textContent = Object.keys(save.clears).length + "/" + UNITS.length;
    $("#wrongCount").textContent = save.wrong.length;
    $("#soundToggle").textContent = save.sound ? "🔊 効果音 ON" : "🔇 効果音 OFF";
  }
  $("#soundToggle").addEventListener("click", () => {
    save.sound = !save.sound; persist(); renderHome(); if (save.sound) SND.select();
  });
  $("#resetBtn").addEventListener("click", () => {
    if (confirm("学習記録（XP・クリア・苦手）をすべてリセットします。よろしいですか？")) {
      localStorage.removeItem(SAVE_KEY);
      save.xp = 0; save.answered = 0; save.correct = 0; save.bestStreak = 0; save.clears = {}; save.wrong = [];
      renderHome(); toast("リセットしました");
    }
  });

  /* ---------------- 単元グリッド ---------------- */
  function renderUnits() {
    const g = $("#unitGrid"); g.innerHTML = "";
    UNITS.forEach((u, i) => {
      const b = document.createElement("button");
      b.className = "unit-tile";
      b.style.background = `linear-gradient(140deg, ${u.color}, ${shade(u.color, -30)})`;
      b.innerHTML =
        `${save.clears[u.id] ? '<span class="u-clear">⭐</span>' : ""}` +
        `<span class="u-ic">${u.icon}</span>` +
        `<span class="u-no">単元 ${i + 1}</span>` +
        `<span class="u-ti">${u.title}</span>` +
        `<span class="u-sub">${u.subtitle}</span>`;
      b.addEventListener("click", () => { SND.tap(); openLearn(u.id); });
      g.appendChild(b);
    });
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  /* ---------------- 学習ビュー ---------------- */
  let learnUnit = null, learnIdx = 0;
  function openLearn(uid) {
    learnUnit = UNITS.find((u) => u.id === uid); learnIdx = 0;
    $("#learnTitle").textContent = learnUnit.icon + " " + learnUnit.title;
    go("learn"); renderLearn();
  }
  function renderLearn() {
    const secs = learnUnit.sections, sec = secs[learnIdx];
    const body = $("#learnBody");
    let html = `<div class="sec-card"><h3>${sec.heading}</h3>`;
    if (sec.diagram && DIAGRAMS[sec.diagram]) html += DIAGRAMS[sec.diagram];
    html += sec.body + `</div>`;
    body.innerHTML = html;
    body.style.animation = "none"; void body.offsetWidth; body.style.animation = "";
    $("#learnProgFill").style.width = ((learnIdx + 1) / secs.length) * 100 + "%";
    $("#learnDots").innerHTML = secs.map((_, i) => `<i class="${i === learnIdx ? "on" : ""}"></i>`).join("");
    $("#learnPrev").style.visibility = learnIdx === 0 ? "hidden" : "visible";
    $("#learnNext").textContent = learnIdx === secs.length - 1 ? "テストへ ▶" : "次 ›";
  }
  $("#learnPrev").addEventListener("click", () => { if (learnIdx > 0) { learnIdx--; SND.tap(); renderLearn(); } });
  $("#learnNext").addEventListener("click", () => {
    if (learnIdx < learnUnit.sections.length - 1) { learnIdx++; SND.tap(); renderLearn(); }
    else { SND.select(); startQuiz(buildQuestions("unit", learnUnit.id, learnUnit.questions.length), "単元 " + learnUnit.title); }
  });

  /* ---------------- 出題セット作成 ---------------- */
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function allQuestions() {
    const out = [];
    UNITS.forEach((u) => u.questions.forEach((q, qi) => out.push({ q, unitId: u.id, qIndex: qi })));
    return out;
  }
  function buildQuestions(scope, unitId, count) {
    let pool;
    if (scope === "unit") { const u = UNITS.find((x) => x.id === unitId); pool = u.questions.map((q, qi) => ({ q, unitId, qIndex: qi })); }
    else pool = allQuestions();
    return shuffle(pool).slice(0, count || pool.length);
  }

  /* ---------------- テスト設定 ---------------- */
  let confScope = "all", confUnit = UNITS[0].id, confCount = 10;
  function renderTestConf() {
    $$("#confScope .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.scope === confScope));
    $$("#confCount .seg-btn").forEach((b) => b.classList.toggle("active", +b.dataset.count === confCount));
    $("#confUnitWrap").classList.toggle("hidden", confScope !== "unit");
    const w = $("#confUnitWrap"); w.innerHTML = "";
    UNITS.forEach((u, i) => {
      const b = document.createElement("button");
      b.className = "cu-btn" + (u.id === confUnit ? " active" : "");
      b.textContent = (i + 1) + ". " + u.title;
      b.addEventListener("click", () => { confUnit = u.id; SND.select(); renderTestConf(); });
      w.appendChild(b);
    });
  }
  $("#confScope").addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (!b) return; confScope = b.dataset.scope; SND.select(); renderTestConf(); });
  $("#confCount").addEventListener("click", (e) => { const b = e.target.closest(".seg-btn"); if (!b) return; confCount = +b.dataset.count; SND.select(); renderTestConf(); });
  $("#startQuiz").addEventListener("click", () => {
    ac(); // ユーザー操作で音を有効化
    const qs = buildQuestions(confScope, confUnit, confCount);
    const label = confScope === "unit" ? "単元 " + UNITS.find((u) => u.id === confUnit).title : "全範囲ランダム";
    startQuiz(qs, label);
  });

  /* ---------------- クイズ本体 ---------------- */
  let quiz = null;
  function startQuiz(list, label) {
    if (!list || !list.length) { toast("出題できる問題がありません"); return; }
    quiz = { list, i: 0, score: 0, combo: 0, maxCombo: 0, startXp: save.xp, label, locked: false, wrongHere: [] };
    go("quiz"); renderQ();
  }
  const TYPE_LABEL = { ox: "○✕問題", choice: "選択問題", input: "記述（1問1答）" };
  function renderQ() {
    quiz.locked = false;
    const item = quiz.list[quiz.i], q = item.q;
    $("#qIndex").textContent = `${quiz.i + 1} / ${quiz.list.length}`;
    $("#qTypeTag").textContent = TYPE_LABEL[q.type] + (q.hot ? " 🔥" : "");
    $("#qProgFill").style.width = (quiz.i / quiz.list.length) * 100 + "%";
    $("#comboTag").textContent = "🔥" + quiz.combo;
    $("#qText").textContent = q.q;
    const area = $("#qArea"); area.innerHTML = "";

    if (q.type === "choice") {
      const order = shuffle(q.choices.map((c, idx) => ({ c, idx })));
      order.forEach((o) => {
        const btn = document.createElement("button");
        btn.className = "opt"; btn.textContent = o.c;
        btn.addEventListener("click", () => answerChoice(btn, o.idx === q.answer, area));
        area.appendChild(btn);
      });
    } else if (q.type === "ox") {
      const wrap = document.createElement("div"); wrap.className = "ox-wrap";
      [["◯", true], ["✕", false]].forEach(([sym, val]) => {
        const btn = document.createElement("button");
        btn.className = "ox-btn"; btn.textContent = sym;
        btn.addEventListener("click", () => answerChoice(btn, val === q.answer, wrap));
        wrap.appendChild(btn);
      });
      area.appendChild(wrap);
    } else {
      const wrap = document.createElement("div"); wrap.className = "inp-wrap";
      const inp = document.createElement("input");
      inp.className = "inp"; inp.type = "text"; inp.placeholder = "答えを入力";
      inp.autocomplete = "off"; inp.autocapitalize = "off";
      const go = document.createElement("button"); go.className = "inp-go"; go.textContent = "答え合わせ";
      const hint = document.createElement("p"); hint.className = "inp-hint"; hint.textContent = "キーワードを入力（記号・スペースは無視されます）";
      const submit = () => answerInput(inp.value, q, area);
      go.addEventListener("click", submit);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
      wrap.appendChild(inp); wrap.appendChild(go); wrap.appendChild(hint); area.appendChild(wrap);
      setTimeout(() => inp.focus(), 250);
    }
  }

  function normalize(s) {
    return (s || "").toString().trim().toLowerCase()
      .replace(/[\s　]/g, "")
      .replace(/[（）()「」、。・，．]/g, "")
      .replace(/[ぁ-ん]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60)); // ひら→カタで吸収
  }
  function inputMatches(val, answers) {
    const v = normalize(val); if (v.length < 2) return false;
    return answers.some((a) => { const n = normalize(a); return v === n || (n.length >= 3 && (v.includes(n) || n.includes(v))); });
  }

  function answerChoice(btn, ok, container) {
    if (quiz.locked) return; quiz.locked = true;
    const item = quiz.list[quiz.i], q = item.q;
    const btns = Array.from(container.querySelectorAll("button"));
    btns.forEach((b) => { b.disabled = true; });
    btn.classList.add(ok ? "correct" : "wrong");
    if (!ok) {
      // 正解の選択肢をハイライト
      if (q.type === "ox") btns.forEach((b) => { if ((b.textContent === "◯") === q.answer) b.classList.add("correct"); });
      else markCorrectChoice(btns, q);
      btns.forEach((b) => { if (!b.classList.contains("correct") && !b.classList.contains("wrong")) b.classList.add("dim"); });
    }
    finishAnswer(ok, item);
  }
  function markCorrectChoice(btns, q) {
    const correctText = q.choices[q.answer];
    btns.forEach((b) => { if (b.textContent === correctText) b.classList.add("correct"); });
  }
  function answerInput(val, q, area) {
    if (quiz.locked) return;
    const item = quiz.list[quiz.i];
    const ok = inputMatches(val, q.answers);
    quiz.locked = true;
    area.querySelectorAll("input,button").forEach((el) => (el.disabled = true));
    finishAnswer(ok, item);
  }

  function finishAnswer(ok, item) {
    const q = item.q;
    save.answered++;
    if (ok) {
      save.correct++; quiz.score++; quiz.combo++;
      quiz.maxCombo = Math.max(quiz.maxCombo, quiz.combo);
      if (quiz.combo > save.bestStreak) save.bestStreak = quiz.combo;
      // 苦手リストから除去
      save.wrong = save.wrong.filter((w) => !(w.unitId === item.unitId && w.qIndex === item.qIndex));
      SND.correct(); flash("rgba(34,211,154,.35)"); confetti(quiz.combo >= 3 ? 50 : 30, 9); vibrate(20);
      if (quiz.combo >= 2) { SND.combo(quiz.combo); const c = $("#comboTag"); c.classList.remove("pop"); void c.offsetWidth; c.classList.add("pop"); }
    } else {
      quiz.combo = 0; quiz.wrongHere.push(item);
      if (!save.wrong.some((w) => w.unitId === item.unitId && w.qIndex === item.qIndex)) save.wrong.push({ unitId: item.unitId, qIndex: item.qIndex });
      SND.wrong(); flash("rgba(255,84,112,.32)"); vibrate([40, 30, 40]);
      $(".qcard").classList.add("shake"); setTimeout(() => $(".qcard").classList.remove("shake"), 420);
    }
    $("#comboTag").textContent = "🔥" + quiz.combo;
    persist();
    showFeedback(ok, q);
  }

  function showFeedback(ok, q) {
    const fb = $("#feedback");
    fb.className = "feedback show " + (ok ? "good" : "bad");
    const head = $("#fbHead"); head.className = "fb-head " + (ok ? "good" : "bad");
    const praises = ["正解！", "ナイス！", "その通り！", "やるね！", "完璧！"];
    head.textContent = ok ? (quiz.combo >= 3 ? `🔥${quiz.combo}コンボ！` : praises[(Math.random() * praises.length) | 0]) : "おしい！もう一度覚えよう";
    let ans = "";
    if (q.type === "input") ans = `<span class="ans">答え：${q.answers[0]}</span><br>`;
    else if (q.type === "choice") ans = `<span class="ans">答え：${q.choices[q.answer]}</span><br>`;
    else ans = `<span class="ans">答え：${q.answer ? "◯" : "✕"}</span><br>`;
    $("#fbExp").innerHTML = ans + q.explain;
  }
  $("#fbNext").addEventListener("click", () => {
    SND.tap();
    $("#feedback").classList.remove("show");
    quiz.i++;
    if (quiz.i >= quiz.list.length) finishQuiz();
    else setTimeout(renderQ, 180);
  });
  $("#quizQuit").addEventListener("click", () => {
    SND.tap();
    if (confirm("テストを中断してホームに戻りますか？")) { $("#feedback").classList.remove("show"); go("home"); }
  });

  /* ---------------- 結果 ---------------- */
  function finishQuiz() {
    $("#qProgFill").style.width = "100%";
    const total = quiz.list.length, score = quiz.score;
    const ratio = score / total;
    // XP 計算：1正解=10XP、コンボボーナス、満点ボーナス
    let xp = score * 10 + quiz.maxCombo * 3 + (ratio === 1 ? 30 : 0);
    const beforeLv = levelInfo().lv;
    save.xp += xp;
    // 単元クリア判定（単元テストで8割以上）
    if (quiz.label.startsWith("単元") && ratio >= 0.8) {
      const u = UNITS.find((x) => quiz.label.includes(x.title));
      if (u) save.clears[u.id] = true;
    }
    persist();
    const afterLv = levelInfo().lv;

    go("result");
    $("#resScore").textContent = score; $("#resTotal").textContent = total;
    $("#resXp").textContent = "+" + xp + " XP";
    $("#resAcc").textContent = Math.round(ratio * 100) + "%";
    $("#resCombo").textContent = quiz.maxCombo;
    let emoji, title;
    if (ratio === 1) { emoji = "🏆"; title = "全問正解！"; }
    else if (ratio >= 0.8) { emoji = "🎉"; title = "クリア！"; }
    else if (ratio >= 0.5) { emoji = "💪"; title = "あと少し！"; }
    else { emoji = "📚"; title = "復習しよう"; }
    $("#resEmoji").textContent = emoji; $("#resTitle").textContent = title;

    SND.finish(); confetti(ratio >= 0.8 ? 90 : 40, 12);
    if (afterLv > beforeLv) {
      setTimeout(() => { SND.levelup(); confetti(80, 13); toast("🆙 レベルアップ！ Lv." + afterLv + " " + titleFor(afterLv)); }, 700);
    }
    // リトライ用に直近設定を保持
    $("#resRetry").onclick = () => { SND.tap(); startQuiz(shuffle(quiz.list), quiz.label); };
  }

  /* ---------------- 復習（苦手） ---------------- */
  function startReview() {
    if (!save.wrong.length) { toast("苦手問題はありません🙆"); setTimeout(() => go("home"), 400); return; }
    const list = save.wrong.map((w) => {
      const u = UNITS.find((x) => x.id === w.unitId); if (!u) return null;
      return { q: u.questions[w.qIndex], unitId: w.unitId, qIndex: w.qIndex };
    }).filter(Boolean);
    startQuiz(shuffle(list), "まちがい復習");
  }

  /* ---------------- 起動 ---------------- */
  load();
  renderHome();
  // 初回タッチで AudioContext を解放（iOS対策）
  document.body.addEventListener("touchstart", function once() { ac(); document.body.removeEventListener("touchstart", once); }, { passive: true });
})();
