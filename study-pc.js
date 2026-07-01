/* =====================================================================
   内管マスター PC版 — アプリ本体
   落ち着いた資料ツール風 UI / キーボード操作対応
   学習データ(STUDY_DATA)・進捗(localStorage)はスマホ版と共有
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const UNITS = STUDY_DATA.units;
  const main = $("#main");

  /* ---------- 進捗（スマホ版と共有） ---------- */
  const SAVE_KEY = "naikan-master-v1";
  const save = { xp: 0, answered: 0, correct: 0, bestStreak: 0, clears: {}, wrong: [] };
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
    Object.assign(save, d);
    if (!Array.isArray(save.wrong)) save.wrong = [];
    if (!save.clears) save.clears = {};
  } catch (e) {}
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

  /* ---------- クリック音（PC独自設定・既定オフ） ---------- */
  const SND_KEY = "naikan-pc-sound";
  let soundOn = localStorage.getItem(SND_KEY) === "1";
  let actx = null;
  function beep(freq, dur, gain) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.value = freq; o.connect(g); g.connect(actx.destination);
      const t = actx.currentTime;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.08));
      o.start(t); o.stop(t + (dur || 0.08) + 0.02);
    } catch (e) {}
  }
  const SND = { click: () => beep(440, 0.05, 0.04), ok: () => beep(660, 0.09, 0.05), ng: () => beep(200, 0.1, 0.05) };

  /* ---------- ルーティング ---------- */
  let view = "home";
  function setActiveNav(v, unitId) {
    $("#nav").querySelectorAll(".nav-btn").forEach((b) => {
      const on = b.dataset.view === v || (unitId && b.dataset.unit === unitId);
      b.classList.toggle("active", !!on);
    });
  }
  function go(v, arg) {
    quiz = null; view = v; main.scrollTop = 0; window.scrollTo(0, 0);
    if (v === "home") { setActiveNav("home"); renderHome(); }
    else if (v === "learn") { setActiveNav("learn", arg); renderLearn(arg); }
    else if (v === "test") { setActiveNav("test"); renderTest(); }
    else if (v === "review") { setActiveNav("review"); startReview(); }
  }

  /* ---------- サイドバーの単元リスト ---------- */
  function buildNavUnits() {
    const wrap = $("#navUnits"); wrap.innerHTML = "";
    UNITS.forEach((u, i) => {
      const b = document.createElement("button");
      b.className = "nav-btn"; b.dataset.view = "learn"; b.dataset.unit = u.id;
      b.innerHTML = `<span class="n">${i + 1}</span>${u.title}` + (save.clears[u.id] ? `<span class="chk">✓</span>` : "");
      b.addEventListener("click", () => { SND.click(); go("learn", u.id); });
      wrap.appendChild(b);
    });
  }
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest(".nav-btn"); if (!b || b.dataset.unit) return;
    SND.click(); go(b.dataset.view);
  });
  $("#sndToggle").checked = soundOn;
  $("#sndToggle").addEventListener("change", (e) => {
    soundOn = e.target.checked; localStorage.setItem(SND_KEY, soundOn ? "1" : "0"); if (soundOn) SND.ok();
  });

  /* ---------- ホーム ---------- */
  function renderHome() {
    const acc = save.answered ? Math.round((save.correct / save.answered) * 100) + "%" : "—";
    const cleared = Object.keys(save.clears).filter((k) => UNITS.some((u) => u.id === k)).length;
    main.innerHTML = `
      <div class="page-head">
        <h1>内部管理責任者 学習</h1>
        <p>公式テキスト準拠の9単元・全${totalQ()}問。学習で要点を押さえ、テストで確認しましょう。</p>
      </div>
      <div class="wrap">
        <div class="stat-row">
          <div class="stat"><div class="v">${cleared}/${UNITS.length}</div><div class="l">クリアした単元</div></div>
          <div class="stat"><div class="v">${acc}</div><div class="l">通算正答率</div></div>
          <div class="stat"><div class="v">${save.wrong.length}</div><div class="l">復習キュー（問）</div></div>
        </div>
        <div class="home-actions">
          <button class="btn" id="hTest">テストを受ける</button>
          <button class="btn sub" id="hReview">まちがい復習</button>
        </div>
        <p class="home-sec-title">学習する単元を選ぶ</p>
        <div class="unit-list" id="homeUnits"></div>
      </div>`;
    const list = $("#homeUnits");
    UNITS.forEach((u, i) => {
      const c = document.createElement("button");
      c.className = "unit-card";
      c.innerHTML = `<span class="no">${String(i + 1).padStart(2, "0")}</span>` +
        `<span><span class="ti">${u.title}</span><span class="su">${u.subtitle} ・ ${u.questions.length}問</span></span>` +
        (save.clears[u.id] ? `<span class="st">✓ クリア</span>` : "");
      c.addEventListener("click", () => { SND.click(); go("learn", u.id); });
      list.appendChild(c);
    });
    $("#hTest").addEventListener("click", () => { SND.click(); go("test"); });
    $("#hReview").addEventListener("click", () => { SND.click(); go("review"); });
  }
  const totalQ = () => UNITS.reduce((a, u) => a + u.questions.length, 0);

  /* ---------- 学習ビュー ---------- */
  function figure(key) {
    if (!key || !DIAGRAMS[key]) return "";
    return `<div class="figure">${DIAGRAMS[key]}<div class="fig-cap">図：要点のイメージ</div></div>`;
  }
  function renderLearn(unitId) {
    const u = UNITS.find((x) => x.id === unitId) || UNITS[0];
    const idx = UNITS.indexOf(u);
    let secs = u.sections.map((s) =>
      `<div class="section"><h3>${s.heading}</h3>${figure(s.diagram)}${s.body}</div>`).join("");
    const prev = idx > 0 ? UNITS[idx - 1] : null;
    const next = idx < UNITS.length - 1 ? UNITS[idx + 1] : null;
    main.innerHTML = `
      <div class="page-head">
        <h1>${idx + 1}. ${u.title}</h1>
        <p>${u.subtitle}　—　${u.sections.length}セクション / ${u.questions.length}問</p>
      </div>
      <div class="wrap">${secs}</div>
      <div class="learn-foot">
        <div>${prev ? `<button class="btn sub" id="lPrev">← ${prev.title}</button>` : ""}</div>
        <button class="btn" id="lTest">この単元のテスト（${u.questions.length}問）</button>
        <div>${next ? `<button class="btn sub" id="lNext">${next.title} →</button>` : ""}</div>
      </div>`;
    if (prev) $("#lPrev").addEventListener("click", () => { SND.click(); go("learn", prev.id); });
    if (next) $("#lNext").addEventListener("click", () => { SND.click(); go("learn", next.id); });
    $("#lTest").addEventListener("click", () => { SND.click(); startQuiz(buildQuestions("unit", u.id), "単元 " + u.title); });
  }

  /* ---------- 出題セット ---------- */
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildQuestions(scope, unitId, count) {
    let pool;
    if (scope === "unit") { const u = UNITS.find((x) => x.id === unitId); pool = u.questions.map((q, qi) => ({ q, unitId, qIndex: qi })); }
    else { pool = []; UNITS.forEach((u) => u.questions.forEach((q, qi) => pool.push({ q, unitId: u.id, qIndex: qi }))); }
    pool = shuffle(pool);
    return count ? pool.slice(0, count) : pool;
  }

  /* ---------- テスト設定 ---------- */
  let cfgScope = "all", cfgUnit = UNITS[0].id, cfgCount = 10;
  function renderTest() {
    main.innerHTML = `
      <div class="page-head"><h1>テスト</h1><p>出題範囲と問題数を選んで開始します。</p></div>
      <div class="wrap">
        <div class="form-block">
          <h3>出題範囲</h3>
          <div class="opt-radios" id="scopeRow">
            <button class="chip ${cfgScope === "all" ? "on" : ""}" data-s="all">全範囲からランダム</button>
            <button class="chip ${cfgScope === "unit" ? "on" : ""}" data-s="unit">単元ごと</button>
          </div>
          <div id="unitSelWrap" style="margin-top:12px; ${cfgScope === "unit" ? "" : "display:none"}">
            <select class="unitsel" id="unitSel"></select>
          </div>
        </div>
        <div class="form-block">
          <h3>問題数</h3>
          <div class="opt-radios" id="countRow">
            <button class="chip ${cfgCount === 10 ? "on" : ""}" data-c="10">10問</button>
            <button class="chip ${cfgCount === 20 ? "on" : ""}" data-c="20">20問</button>
            <button class="chip ${cfgCount === 0 ? "on" : ""}" data-c="0">すべて</button>
          </div>
        </div>
        <button class="btn" id="startBtn">開始する</button>
      </div>`;
    const sel = $("#unitSel");
    UNITS.forEach((u, i) => { const o = document.createElement("option"); o.value = u.id; o.textContent = `${i + 1}. ${u.title}（${u.questions.length}問）`; if (u.id === cfgUnit) o.selected = true; sel.appendChild(o); });
    sel.addEventListener("change", (e) => { cfgUnit = e.target.value; });
    $("#scopeRow").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; cfgScope = b.dataset.s; SND.click(); renderTest(); });
    $("#countRow").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (!b) return; cfgCount = +b.dataset.c; SND.click(); renderTest(); });
    $("#startBtn").addEventListener("click", () => {
      SND.click();
      const label = cfgScope === "unit" ? "単元 " + UNITS.find((u) => u.id === cfgUnit).title : "全範囲ランダム";
      startQuiz(buildQuestions(cfgScope, cfgUnit, cfgCount || 0), label);
    });
  }

  /* ---------- 復習 ---------- */
  function startReview() {
    const list = save.wrong.map((w) => {
      const u = UNITS.find((x) => x.id === w.unitId); if (!u || !u.questions[w.qIndex]) return null;
      return { q: u.questions[w.qIndex], unitId: w.unitId, qIndex: w.qIndex };
    }).filter(Boolean);
    if (list.length !== save.wrong.length) { save.wrong = list.map((x) => ({ unitId: x.unitId, qIndex: x.qIndex })); persist(); }
    if (!list.length) {
      main.innerHTML = `<div class="page-head"><h1>まちがい復習</h1></div>
        <div class="wrap"><div class="section"><p>復習する問題はありません。テストで間違えた問題がここに貯まります。</p>
        <button class="btn" id="toTest">テストを受ける</button></div></div>`;
      $("#toTest").addEventListener("click", () => { SND.click(); go("test"); });
      return;
    }
    startQuiz(shuffle(list), "まちがい復習");
  }

  /* ---------- クイズ ---------- */
  let quiz = null;
  const TYPE_LABEL = { ox: "正誤（○×）問題", choice: "選択問題", input: "記述" };
  function startQuiz(list, label) {
    if (!list || !list.length) { go("home"); return; }
    quiz = { list, i: 0, score: 0, wrong: [], label, locked: false };
    renderQ();
  }
  function renderQ() {
    quiz.locked = false;
    const item = quiz.list[quiz.i], q = item.q;
    main.innerHTML = `
      <div class="quiz-top">
        <span class="count">${quiz.i + 1} / ${quiz.list.length}</span>
        <div class="prog-track"><div class="prog-fill" style="width:${(quiz.i / quiz.list.length) * 100}%"></div></div>
        <button class="btn sub" id="quitBtn" style="padding:6px 12px">中断</button>
      </div>
      <div class="q-card">
        <span class="q-type">${quiz.label}　·　${TYPE_LABEL[q.type] || ""}</span>
        <p class="q-text">${escapeHtml(q.q)}</p>
        <div id="ansArea"></div>
      </div>
      <div id="fbSlot"></div>
      <div class="kbd-hint" id="kbdHint"></div>`;
    $("#quitBtn").addEventListener("click", () => { SND.click(); if (confirm("テストを中断してホームに戻りますか？")) go("home"); });
    const area = $("#ansArea");
    if (q.type === "ox") {
      const row = document.createElement("div"); row.className = "ox-row";
      [["O", "○（正しい）", true], ["X", "×（誤り）", false]].forEach(([key, text, val]) => {
        const b = mkChoice(key, text);
        b.dataset.correct = (val === q.answer) ? "1" : "0";
        b.addEventListener("click", () => answer(val === q.answer, b, row, q));
        row.appendChild(b);
      });
      area.appendChild(row);
      $("#kbdHint").innerHTML = `キーボード：<span class="kbd">O</span>=○　<span class="kbd">X</span>=×`;
    } else if (q.type === "choice") {
      const order = shuffle(q.choices.map((c, idx) => ({ c, idx })));
      const box = document.createElement("div"); box.className = "choices";
      order.forEach((o, n) => {
        const b = mkChoice(String(n + 1), o.c);
        b.dataset.correct = (o.idx === q.answer) ? "1" : "0";
        b.addEventListener("click", () => answer(o.idx === q.answer, b, box, q));
        box.appendChild(b);
      });
      area.appendChild(box);
      $("#kbdHint").innerHTML = `キーボード：<span class="kbd">1</span>〜<span class="kbd">4</span>で選択`;
    }
  }
  function mkChoice(key, text) {
    const b = document.createElement("button");
    b.className = "choice"; b.type = "button";
    b.innerHTML = `<span class="k">${key}</span><span>${escapeHtml(text)}</span>`;
    return b;
  }
  function answer(ok, btn, container, q) {
    if (quiz.locked) return; quiz.locked = true;
    const item = quiz.list[quiz.i];
    const btns = Array.from(container.querySelectorAll(".choice"));
    btns.forEach((b) => (b.disabled = true));
    btn.classList.add(ok ? "correct" : "wrong");
    if (!ok) {
      btns.forEach((b) => { if (b.dataset.correct === "1") b.classList.add("correct"); });
      btns.forEach((b) => { if (!b.classList.contains("correct") && !b.classList.contains("wrong")) b.classList.add("dim"); });
    }
    // 進捗更新
    save.answered++;
    if (ok) {
      save.correct++; quiz.score++;
      save.wrong = save.wrong.filter((w) => !(w.unitId === item.unitId && w.qIndex === item.qIndex));
      SND.ok();
    } else {
      quiz.wrong.push(item);
      if (!save.wrong.some((w) => w.unitId === item.unitId && w.qIndex === item.qIndex)) save.wrong.push({ unitId: item.unitId, qIndex: item.qIndex });
      SND.ng();
    }
    persist();
    showFeedback(ok, q);
  }
  function showFeedback(ok, q) {
    let ansTxt;
    if (q.type === "ox") ansTxt = q.answer ? "○（正しい）" : "×（誤り）";
    else ansTxt = q.choices[q.answer];
    const ref = q.ref ? `<span class="fb-ref">参照：${q.ref}</span>` : "";
    const slot = $("#fbSlot");
    slot.innerHTML = `
      <div class="feedback ${ok ? "good" : "bad"}">
        <div class="fb-verdict ${ok ? "good" : "bad"}">${ok ? "正解" : "不正解"}</div>
        <div class="fb-ans">答え：${escapeHtml(ansTxt)}</div>
        <p class="fb-exp">${escapeHtml(q.explain || "")}</p>
        ${ref}
      </div>
      <div class="quiz-foot"><button class="btn" id="nextBtn">${quiz.i + 1 >= quiz.list.length ? "結果を見る" : "次の問題 →"}</button></div>`;
    const nb = $("#nextBtn");
    nb.addEventListener("click", nextQ);
    nb.focus();
  }
  function nextQ() {
    SND.click();
    quiz.i++;
    if (quiz.i >= quiz.list.length) finishQuiz();
    else renderQ();
  }
  function finishQuiz() {
    const total = quiz.list.length, score = quiz.score, ratio = score / total;
    save.xp += score * 10; // 進捗の互換のため加算のみ
    if (quiz.label.indexOf("単元") === 0) {
      const u = UNITS.find((x) => quiz.label.indexOf(x.title) >= 0);
      if (u && ratio >= 0.8) save.clears[u.id] = true;
    }
    persist(); buildNavUnits();
    main.innerHTML = `
      <div class="result">
        <h2>${quiz.label}</h2>
        <div class="score">${score}<small> / ${total} 正解</small></div>
        <div class="rmeta">
          <div><b>${Math.round(ratio * 100)}%</b>正答率</div>
          <div><b>${total - score}</b>間違い</div>
        </div>
        <div class="result-actions">
          <button class="btn" id="rRetry">もう一度</button>
          ${quiz.wrong.length ? `<button class="btn sub" id="rReview">間違いだけ復習</button>` : ""}
          <button class="btn sub" id="rHome">ホームへ</button>
        </div>
      </div>`;
    const retryList = quiz.list, wrongList = quiz.wrong.slice(), label = quiz.label;
    $("#rRetry").addEventListener("click", () => { SND.click(); startQuiz(shuffle(retryList), label); });
    if (wrongList.length) $("#rReview").addEventListener("click", () => { SND.click(); startQuiz(shuffle(wrongList), "間違いの復習"); });
    $("#rHome").addEventListener("click", () => { SND.click(); go("home"); });
  }

  /* ---------- キーボード操作 ---------- */
  document.addEventListener("keydown", (e) => {
    if (!quiz) return;
    const nb = document.getElementById("nextBtn");
    if (nb) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nextQ(); } return; }
    if (quiz.locked) return;
    const area = document.getElementById("ansArea"); if (!area) return;
    const q = quiz.list[quiz.i].q;
    if (q.type === "choice") {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) { const b = area.querySelectorAll(".choice")[n - 1]; if (b) b.click(); }
    } else if (q.type === "ox") {
      const k = e.key.toLowerCase();
      if (k === "o" || k === "0") area.querySelectorAll(".choice")[0].click();
      else if (k === "x") area.querySelectorAll(".choice")[1].click();
    }
  });

  /* ---------- ユーティリティ ---------- */
  function escapeHtml(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- 起動 ---------- */
  buildNavUnits();
  go("home");
})();
