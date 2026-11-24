/* =========================================================
 * 潜在的自尊心 IAT 本体
 * 7ブロック構成（Greenwald et al., 2003; Nosek et al., 2005）
 * ========================================================= */
const C = IAT_CONFIG;
const CAT = C.CATEGORIES;

/* ---------- ユーティリティ ---------- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 刺激語をn個、できるだけ均等に抽出（全語を一巡させ、余りはランダム）
function sampleBalanced(words, n) {
  const out = [];
  while (out.length + words.length <= n) out.push(...words);
  out.push(...shuffle(words).slice(0, n - out.length));
  return shuffle(out);
}

// 全角英数字→半角、前後の空白除去、英字は大文字に統一
function normalizePid(v) {
  return String(v || "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\s　]/g, "")
    .toUpperCase();
}

const params = new URLSearchParams(location.search);
const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
let PID = ""; // 参加者番号（開始前の画面で入力。URLの ?pid=12 で初期値を入れることも可）
const PID_RE = new RegExp(C.PID_PATTERN);
// 実施順序：A = 一致（自分＋快）が先、B = 不一致（他人＋快）が先
// 参加者番号に含まれる数字の末尾が 奇数 → A、偶数 → B（カウンターバランス）
let ORDER = "";
function orderFromPid(pid) {
  const m = String(pid).match(/(\d+)(?!.*\d)/);
  if (!m) return "A";
  return parseInt(m[1], 10) % 2 === 1 ? "A" : "B";
}
const STARTED_AT = new Date().toISOString();

/* ---------- 試行の生成 ---------- */
const clsOf = (key) => (key === "self" || key === "other" ? "target" : "attribute");
const lab = (key) => ({ text: CAT[key].label, cls: clsOf(key) });

function trialObj(word, catKey, side, leftKeys, rightKeys, meta) {
  return {
    type: IatTrialPlugin,
    stimulus: word,
    stim_class: clsOf(catKey),
    correct_side: side,
    left_labels: leftKeys.map(lab),
    right_labels: rightKeys.map(lab),
    left_key: C.LEFT_KEY,
    right_key: C.RIGHT_KEY,
    post_trial_gap: C.ITI_MS,
    data: { task: "iat", category: catKey, ...meta },
  };
}

// 2カテゴリだけのブロック（ブロック1・2・5）
function singleBlock(n, leftKey, rightKey, meta) {
  const items = [
    ...sampleBalanced(CAT[leftKey].words, n / 2).map((w) => [w, leftKey, "left"]),
    ...sampleBalanced(CAT[rightKey].words, n / 2).map((w) => [w, rightKey, "right"]),
  ];
  return shuffle(items).map(([w, k, s], i) =>
    trialObj(w, k, s, [leftKey], [rightKey], { ...meta, trial_in_block: i + 1 })
  );
}

// 組み合わせブロック（ブロック3・4・6・7）：概念語と属性語を交互に提示
function combinedBlock(n, leftT, rightT, leftA, rightA, meta) {
  const half = n / 2;
  const nL = Math.ceil(half / 2), nR = Math.floor(half / 2);
  const targets = shuffle([
    ...sampleBalanced(CAT[leftT].words, nL).map((w) => [w, leftT, "left"]),
    ...sampleBalanced(CAT[rightT].words, nR).map((w) => [w, rightT, "right"]),
  ]);
  const attrs = shuffle([
    ...sampleBalanced(CAT[leftA].words, nR).map((w) => [w, leftA, "left"]),
    ...sampleBalanced(CAT[rightA].words, nL).map((w) => [w, rightA, "right"]),
  ]);
  const items = [];
  for (let i = 0; i < half; i++) items.push(targets[i], attrs[i]);
  return items.map(([w, k, s], i) =>
    trialObj(w, k, s, [leftT, leftA], [rightT, rightA], { ...meta, trial_in_block: i + 1 })
  );
}

/* ---------- ブロック構成 ---------- */
// 属性（快/不快）の左右は固定し、概念（自分/他人）の左右をブロック5で入れ替える
const T = C.TRIALS;
function makeBlocks(order) {
  const first = order === "A" ? ["self", "other"] : ["other", "self"];
  const second = [first[1], first[0]];
  const pairing1 = order === "A" ? "compatible" : "incompatible";
  const pairing2 = order === "A" ? "incompatible" : "compatible";
  return [
    { no: 1, kind: "single", L: [first[0]], R: [first[1]],
      trials: () => singleBlock(T.b1, first[0], first[1], { block: 1, phase: "single", pairing: "" }) },
    { no: 2, kind: "single", L: ["positive"], R: ["negative"],
      trials: () => singleBlock(T.b2, "positive", "negative", { block: 2, phase: "single", pairing: "" }) },
    { no: 3, kind: "combined", L: [first[0], "positive"], R: [first[1], "negative"],
      trials: () => combinedBlock(T.b3, first[0], first[1], "positive", "negative", { block: 3, phase: "practice", pairing: pairing1 }) },
    { no: 4, kind: "combined", L: [first[0], "positive"], R: [first[1], "negative"], again: true,
      trials: () => combinedBlock(T.b4, first[0], first[1], "positive", "negative", { block: 4, phase: "test", pairing: pairing1 }) },
    { no: 5, kind: "single", L: [second[0]], R: [second[1]], switched: true,
      trials: () => singleBlock(T.b5, second[0], second[1], { block: 5, phase: "single", pairing: "" }) },
    { no: 6, kind: "combined", L: [second[0], "positive"], R: [second[1], "negative"],
      trials: () => combinedBlock(T.b6, second[0], second[1], "positive", "negative", { block: 6, phase: "practice", pairing: pairing2 }) },
    { no: 7, kind: "combined", L: [second[0], "positive"], R: [second[1], "negative"], again: true,
      trials: () => combinedBlock(T.b7, second[0], second[1], "positive", "negative", { block: 7, phase: "test", pairing: pairing2 }) },
  ];
}

function catSpan(keys) {
  return keys.map((k) => `<span class="cat ${clsOf(k)}">${CAT[k].label}</span>`).join(' <span class="or-inline">または</span> ');
}

function blockInstruction(b) {
  let lead = "";
  if (b.again) lead = "<p>直前と<b>同じ分け方</b>で、もう一度行います。</p>";
  else if (b.switched) lead = '<p class="warn">⚠ ここから<b>左右が入れ替わります</b>。注意してください。</p>';
  else if (b.kind === "combined") lead = "<p>今度は、<b>4つのカテゴリ</b>を組み合わせて分類します。</p>";
  return `
    <h2>パート ${b.no} / 7</h2>
    ${lead}
    <div class="assign">
      <div class="side"><div class="key">${C.LEFT_KEY}</div><div>${catSpan(b.L)}</div></div>
      <div class="side"><div class="key">${C.RIGHT_KEY}</div><div>${catSpan(b.R)}</div></div>
    </div>
    <p>画面中央に出る言葉が、左のカテゴリなら <b>${C.LEFT_KEY}</b> キー、右のカテゴリなら <b>${C.RIGHT_KEY}</b> キーを押してください。</p>
    <p>間違えると赤い ✕ が出るので、正しいキーを押し直してください。<br><b>できるだけ速く、正確に</b>回答してください。</p>`;
}

/* ---------- Dスコア算出（Greenwald, Nosek, & Banaji, 2003）----------
 * 誤答時に押し直しを求める手続きなので、正答までのRT（rt_correct）を使う
 * 「組み込み誤答ペナルティ」版の D を算出する。
 * D > 0 ほど「自分＝快」の連合が強い（潜在的自尊心が高い）。 */
function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length; }
function sd(a) {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}

function computeD(trials) {
  // 「実験をやめる」の確認画面で止まった試行はRTが正しくないので除く
  const crit = trials.filter((t) => (t.phase === "practice" || t.phase === "test") && !t.interrupted);
  const fastRate = crit.filter((t) => t.rt < 300).length / crit.length;
  const errorRate = crit.filter((t) => !t.correct).length / crit.length;
  const valid = crit.filter((t) => t.rt_correct <= 10000);
  const part = (phase) => {
    const comp = valid.filter((t) => t.phase === phase && t.pairing === "compatible").map((t) => t.rt_correct);
    const inc = valid.filter((t) => t.phase === phase && t.pairing === "incompatible").map((t) => t.rt_correct);
    return { d: (mean(inc) - mean(comp)) / sd(comp.concat(inc)), mComp: mean(comp), mInc: mean(inc) };
  };
  const p = part("practice");
  const t = part("test");
  return {
    D: (p.d + t.d) / 2,
    D_practice: p.d,
    D_test: t.d,
    mean_rt_compatible: (p.mComp + t.mComp) / 2,
    mean_rt_incompatible: (p.mInc + t.mInc) / 2,
    error_rate: errorRate,
    fast_rate: fastRate,
    n_removed_slow: crit.length - valid.length,
    exclude_flag: fastRate > 0.1, // 300ms未満の反応が10%超 → 分析から除外
  };
}

/* ---------- データ保存 ---------- */
const TRIAL_FIELDS = ["block", "phase", "pairing", "trial_in_block", "stimulus", "category", "stim_class",
  "correct_side", "response_side", "correct", "rt", "rt_correct", "n_errors", "interrupted"];

async function saveData(jsPsych) {
  const trials = jsPsych.data.get().filter({ task: "iat" }).values()
    .map((t) => Object.fromEntries(TRIAL_FIELDS.map((f) => [f, t[f]])));
  const summary = computeD(trials);
  const payload = {
    pid: PID,
    order: ORDER,
    started_at: STARTED_AT,
    finished_at: new Date().toISOString(),
    user_agent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    summary,
    trials,
    questionnaire: collectQuestionnaire(jsPsych),
  };
  window.__IAT_RESULT__ = payload; // 動作確認用

  if (!C.GAS_URL) return { ok: false, reason: "no_url" };
  if (!consentSaved) await sendConsent(); // 同意の送信に失敗していた場合はここで再送
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(C.GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });
      const json = await res.json();
      if (json.status === "ok") return { ok: true };
    } catch (e) {
      console.warn("save failed", attempt, e);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { ok: false, reason: "network" };
}

/* ---------- タイムライン ---------- */
function isProbablyPC() {
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  return window.innerWidth >= C.MIN_SCREEN_WIDTH && (fine || !coarse);
}

/* ---------- 「実験をやめる」ボタン（倫理的手続き：いつでも参加をやめられる）----------
 * 画面右下に常に表示。押すと確認画面が出て、「やめる」を選ぶとその場で終了する。
 * 中断した場合、回答データは一切送信・保存しない。 */
function setupQuitButton(jsPsych) {
  const btn = document.createElement("button");
  btn.id = "quit-btn";
  btn.type = "button";
  btn.tabIndex = -1;
  btn.textContent = "実験をやめる";
  // マウスで押してもボタンにフォーカスが残らないようにする（スペースキーで誤って押されないため）
  btn.addEventListener("mousedown", (e) => e.preventDefault());

  const modal = document.createElement("div");
  modal.id = "quit-modal";
  modal.innerHTML = `
    <div class="quit-box">
      <h2>実験をやめますか？</h2>
      <p>やめても、あなたに不利益が生じることは一切ありません。<br>
      ここまでの回答は<b>保存されず、すべて破棄</b>されます。</p>
      <div class="quit-actions">
        <button type="button" tabindex="-1" class="jspsych-btn" id="quit-yes">やめる</button>
        <button type="button" tabindex="-1" class="jspsych-btn" id="quit-no">続ける</button>
      </div>
    </div>`;
  modal.querySelectorAll("button").forEach((b) => b.addEventListener("mousedown", (e) => e.preventDefault()));

  document.body.append(btn, modal);

  btn.addEventListener("click", () => {
    window.IAT_PAUSE.paused = true;
    window.IAT_PAUSE.count++;
    modal.style.display = "flex";
  });
  modal.querySelector("#quit-no").addEventListener("click", () => {
    modal.style.display = "none";
    window.IAT_PAUSE.paused = false;
  });
  modal.querySelector("#quit-yes").addEventListener("click", () => {
    window.IAT_PAUSE.aborted = true;
    modal.remove();
    btn.remove();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    jsPsych.abortExperiment(`<div class="instr">
      <h2>実験を終了しました</h2>
      <p>ご協力ありがとうございました。ここまでの回答は保存されていません。</p>
      <p>このページを閉じてください。</p>
      <p class="small">問い合わせ先：${contactHtml()}</p>
    </div>`);
  });
}

function hideQuitButton() {
  document.getElementById("quit-btn")?.remove();
  document.getElementById("quit-modal")?.remove();
}

function run() {
  const jsPsych = initJsPsych({ display_element: "jspsych-target" });

  if (!isProbablyPC() && params.get("skipcheck") !== "1") {
    document.getElementById("jspsych-target").innerHTML = `
      <div class="instr"><h2>PCからご参加ください</h2>
      <p>この調査はキーボードを使って回答するため、スマートフォン・タブレットでは参加できません。</p>
      <p>お手数ですが、パソコンから同じURLにアクセスしてください。</p></div>`;
    return;
  }

  const timeline = [];

  /* ---- 研究参加の説明と同意（署名）---- */
  timeline.push({
    type: ConsentPlugin,
    data: { task: "consent" },
    on_finish: () => setupQuitButton(jsPsych), // 同意したあとから「実験をやめる」ボタンを出す
  });

  /* ---- 参加者番号の入力 → 確認（「修正する」を押すと入力に戻る）---- */
  let pidError = "";
  const pidInput = {
    type: jsPsychSurveyHtmlForm,
    preamble: () => `<div class="instr"><h2>参加者番号の入力</h2>
      <p>実施者から伝えられた<b>参加者番号</b>を入力してください。</p>
      ${pidError ? `<p class="warn">${pidError}</p>` : ""}</div>`,
    html: () => `<p><input name="pid" id="pid-input" class="pid-input" type="text" inputmode="numeric"
      autocomplete="off" required value="${esc(PID || normalizePid(params.get("pid")))}" placeholder="${C.PID_EXAMPLE}"></p>
      <p class="small center">${C.PID_HINT}</p>`,
    autofocus: "pid-input",
    button_label: "次へ",
    data: { task: "pid_input" },
    on_finish: (d) => {
      PID = normalizePid(d.response.pid);
      pidError = PID_RE.test(PID) ? "" : `「${esc(PID) || "（空欄）"}」は参加者番号の形式ではありません。もう一度確認してください。`;
    },
  };
  const pidConfirm = {
    timeline: [{
      type: jsPsychHtmlButtonResponse,
      stimulus: () => `<div class="instr"><h2>参加者番号の確認</h2>
        <p class="center">あなたの参加者番号は</p><p class="pid">${PID}</p>
        <p class="center">で間違いありませんか？</p></div>`,
      choices: ["はい、これで始める", "修正する"],
      data: { task: "pid_confirm" },
    }],
    conditional_function: () => pidError === "",
  };
  timeline.push({
    timeline: [pidInput, pidConfirm],
    loop_function: (data) => {
      if (pidError) return true;
      const conf = data.filter({ task: "pid_confirm" }).values();
      if (conf.length && conf[conf.length - 1].response === 0) {
        ORDER = orderFromPid(PID);
        jsPsych.data.addProperties({ pid: PID, iat_order: ORDER });
        sendConsent(); // 同意の記録（署名）だけを consent シートへ送る
        return false;
      }
      return true;
    },
  });

  timeline.push({
    type: jsPsychFullscreen,
    fullscreen_mode: true,
    message: `<div class="instr"><p>課題に集中していただくため、全画面表示に切り替えます。</p>
      <p>静かな環境で、キーボードの <b>${C.LEFT_KEY}</b> と <b>${C.RIGHT_KEY}</b> に左右の人差し指を置いてください。</p></div>`,
    button_label: "全画面にして次へ",
  });

  const table = ["self", "other", "positive", "negative"]
    .map((k) => `<tr><th><span class="cat ${clsOf(k)}">${CAT[k].label}</span></th><td>${CAT[k].words.join("、")}</td></tr>`)
    .join("");
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div class="instr">
      <h2>課題の説明</h2>
      <p>このあと、画面中央に言葉が1つずつ表示されます。それぞれの言葉がどのカテゴリに当てはまるかを、キーを押して分類してください。</p>
      <p>使われるカテゴリと言葉は次のとおりです。</p>
      <table class="words">${table}</table>
      <p>課題は全部で7つのパートに分かれています。各パートの最初に、どのキーがどのカテゴリかが表示されます。</p>
      <p><b>できるだけ速く、そしてできるだけ間違えないように</b>回答してください。</p>
    </div>`,
    choices: ["次へ"],
  });

  // 順序A・Bの両方を用意しておき、参加者番号で決まった方だけを実行する
  ["A", "B"].forEach((order) => {
    const seq = [];
    makeBlocks(order).forEach((b) => {
      seq.push({ type: SpaceScreenPlugin, html: blockInstruction(b), data: { task: "instruction", block: b.no } });
      seq.push({ timeline: b.trials() });
    });
    timeline.push({ timeline: seq, conditional_function: () => ORDER === order });
  });

  /* ---- 質問紙（IATのあとに続けて回答）---- */
  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div class="instr">${QUESTIONNAIRE.INTRO}</div>`,
    choices: ["質問紙に進む"],
  });
  timeline.push(...buildQuestionnaireTimeline());

  let saveResult = { ok: false };
  timeline.push({
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div class="instr"><h2>データを保存しています…</h2><p>このままお待ちください。ページを閉じないでください。</p></div>`,
    choices: "NO_KEYS",
    trial_duration: 300,
    on_start: hideQuitButton, // 課題が終わったら「やめる」ボタンは消す
  });
  timeline.push({
    type: jsPsychCallFunction,
    async: true,
    func: (done) => {
      saveData(jsPsych).then((r) => { saveResult = r; done(r); });
    },
  });
  timeline.push({ type: jsPsychFullscreen, fullscreen_mode: false, delay_after: 0 });

  timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: () => {
      let saveMsg = "";
      if (!saveResult.ok) {
        jsPsych.data.get().localSave("csv", `iat_${PID}.csv`);
        saveMsg = `<p class="warn">⚠ データの自動送信に失敗しました。ダウンロードされたファイル（iat_${PID}.csv）を実施者に送ってください。</p>`;
      }
      return `<div class="instr">
        <h2>これですべて終了です。ご協力ありがとうございました。</h2>
        ${saveMsg}
        <p class="center">あなたの参加者番号</p>
        <p class="pid">${esc(PID)}</p>
        <p class="center warn">この番号を控えてください（スクリーンショットやメモでかまいません）。</p>
        <div class="endinfo">
          <p><b>同意の取り消し</b>　${cfg(C.DELETE_DEADLINE, "削除受付の期日")}までに、上の参加者番号を下記の問い合わせ先へ連絡すれば、あなたのデータを削除します。</p>
          <p><b>問い合わせ先</b>　${contactHtml()}</p>
        </div>
        ${QUESTIONNAIRE.DEBRIEF}
        <p class="center">このページを閉じて終了してください。</p>
      </div>`;
    },
    choices: [],
  });

  jsPsych.run(timeline);
}

window.addEventListener("load", run);
