/* =========================================================
 * 質問紙（IATのあとに続けて回答してもらう）
 * 項目の文言・提示順・逆転項目・下位尺度は「本調査_質問項目.xlsx」（2026/11/26 版）から転記。
 * 回答は5つの独立した丸（○）をクリックして選ぶ形式（線でつながっていない）。
 * 全項目回答必須。答えたくない場合は「実験をやめる」ボタンでやめてもらう。
 * 回答は IAT の結果と一緒に送信され、summary シートに参加者番号ごとの1行
 * （Dスコア＋全項目の素点＋尺度得点）として保存されます。
 * ========================================================= */

const QUESTIONNAIRE = {
  // IATが終わったあとの切り替え画面
  INTRO: `<h2>課題は終了です</h2>
    <p>おつかれさまでした。続いて、いくつかの質問にお答えください。</p>
    <p>それぞれの文章について、あてはまる程度を<b>5つの丸の中から1つ</b>クリックして選び、ページの下にある「次へ」を押して進んでください。すべての質問に回答すると次に進めます。<br>
    答えたくない質問がある場合は、画面右下の「実験をやめる」ボタンで参加をやめることができます（それまでの回答は保存されません）。<br>
    正しい答えや間違った答えはありません。あまり深く考えず、あなたに一番近いものを選んでください。</p>`,

  SCALES: [
    {
      id: "rse",
      name: "自尊感情尺度（山本・松井・山成, 1982）",
      instruction: "次の特徴のおのおのについて，あなた自身にどの程度あてはまるかをお答え下さい。他からどう見られているかではなく，あなたが，あなた自身をどのように思っているかを，ありのままにお答え下さい。",
      // 選択肢1〜5（左から順に表示。数値は1〜5点）
      labels: ["あてはまらない", "ややあてはまらない", "どちらともいえない", "ややあてはまる", "あてはまる"],
      per_page: 11,
      // 採点：逆転項目は 6−素点。10項目の合計（10〜50点）
      items: [
        { id: "r01", text: "少なくとも人並みには，価値のある人間である。" },
        { id: "r02", text: "色々な良い素質をもっている。" },
        { id: "r03", text: "敗北者だと思うことがよくある。", reverse: true },
        { id: "r04", text: "物事を人並みには，うまくやれる。" },
        { id: "r05", text: "自分には，自慢できるところがあまりない。", reverse: true },
        { id: "chk1", text: "この項目では必ず3をチェックしてください", check: 3 },
        { id: "r06", text: "自分に対して肯定的である。" },
        { id: "r07", text: "だいたいにおいて，自分に満足している。" },
        { id: "r08", text: "もっと自分自身を尊敬できるようになりたい。", reverse: true },
        { id: "r09", text: "自分は全くだめな人間だと思うことがある。", reverse: true },
        { id: "r10", text: "何かにつけて，自分は役に立たない人間だと思う。", reverse: true },
      ],
    },
    {
      id: "oa",
      name: "過剰適応尺度（石津, 2006；石津・安保, 2008）",
      instruction: "以下の項目を読んで，それが自分の性質に当てはまる程度を答えてください。",
      labels: ["全く当てはまらない", "当てはまらない", "どちらともいえない", "当てはまる", "よく当てはまる"],
      per_page: 12,
      // side：external＝外的側面／internal＝内的側面
      // sub ：other_care＝他者配慮, expectation＝期待に沿う努力, approval＝人からよく思われたい欲求,
      //       suppression＝自己抑制, inadequacy＝自己不全感
      items: [
        { id: "a03", text: "人がしてほしいことは何かと考える", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a32", text: "自分には自信がない", side: "internal", sub: "inadequacy" }, // 内的・自己不全感
        { id: "a13", text: "期待にこたえるために，成績をあげるように努力する", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a08", text: "つらいことがあっても我慢する", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a18", text: "人から認めてもらいたいと思う", side: "external", sub: "approval" }, // 外的・人からよく思われたい欲求
        { id: "a07", text: "やりたくないことでも無理をしてやることが多い", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a21", text: "自分の気持ちをおさえてしまうほうだ", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a11", text: "他者からの期待を敏感に感じている", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a17", text: "人から気に入られたいと思う", side: "external", sub: "approval" }, // 外的・人からよく思われたい欲求
        { id: "a04", text: "「自分さえ我慢すればいい」と思うことが多い", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a24", text: "考えていることをすぐには言わない", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a25", text: "思っていることを口に出せない", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a05", text: "人からの要求に敏感なほうである", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a27", text: "自分の意見を通そうとしない", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a22", text: "自分自身が思っていることは，外に出さない", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a16", text: "相手にきらわれないように行動する", side: "external", sub: "approval" }, // 外的・人からよく思われたい欲求
        { id: "chk2", text: "この項目では必ず3をチェックしてください", check: 3 },
        { id: "a29", text: "自分には，あまりよいところがない気がする", side: "internal", sub: "inadequacy" }, // 内的・自己不全感
        { id: "a10", text: "期待にこたえないと，しかられそうで心配になる", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a06", text: "とにかく人の役にたちたいと思う", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a26", text: "相手と違う事を思っていても，それを相手に伝えない", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a20", text: "他人の顔色や様子が気になるほうである", side: "external", sub: "approval" }, // 外的・人からよく思われたい欲求
        { id: "a30", text: "自分の評価はあまりよくないと思う", side: "internal", sub: "inadequacy" }, // 内的・自己不全感
        { id: "a02", text: "自分が少し困っても，相手のために何かしてあげることが多い", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a12", text: "人からほめてもらえることを考えて行動する", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a15", text: "期待にはこたえなくてはいけないと思う", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a23", text: "心に思っていることを人に伝えない", side: "internal", sub: "suppression" }, // 内的・自己抑制
        { id: "a19", text: "自分をよく見せたいと思う", side: "external", sub: "approval" }, // 外的・人からよく思われたい欲求
        { id: "a09", text: "人から“能力が低い”と思われないようにがんばる", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a01", text: "相手がどんな気持ちか考えることが多い", side: "external", sub: "other_care" }, // 外的・他者配慮
        { id: "a28", text: "自分のあまりよくないところばかり気になる", side: "internal", sub: "inadequacy" }, // 内的・自己不全感
        { id: "a33", text: "自分らしさがないと思う", side: "internal", sub: "inadequacy" }, // 内的・自己不全感
        { id: "a14", text: "自分の価値がなくなってしまうのではないかと心配になりがむしゃらにがんばる", side: "external", sub: "expectation" }, // 外的・期待に沿う努力
        { id: "a31", text: "自分はひとりぼっちと感じることがある", side: "internal", sub: "inadequacy" }, // 内的・自己不全感
      ],
    },
  ],

  // フェイス項目（本調査_質問項目.xlsx「フェイス項目」シート）
  DEMOGRAPHICS: `
    <div class="instr">
      <h2>あなた自身について</h2>
      <p>最後に、あなた自身についてお答えください。</p>
      <table class="demo">
        <tr><th>あなたの性別を教えてください。</th><td>
          <label><input type="radio" name="sex" value="男性" required> 男性</label>
          <label><input type="radio" name="sex" value="女性"> 女性</label>
          <label><input type="radio" name="sex" value="無回答"> 無回答</label>
        </td></tr>
        <tr><th>あなたの年齢を教えてください。</th><td>
          <select name="age" required>
            <option value="">選択してください</option>
            <option value="18">18歳</option><option value="19">19歳</option><option value="20">20歳</option><option value="21">21歳</option>
            <option value="22">22歳</option><option value="23">23歳</option><option value="24">24歳</option><option value="25">25歳</option><option value="その他">その他（26歳以上）</option>
          </select>
        </td></tr>
        <tr><th>あなたの学年を教えてください。</th><td>
          <select name="grade" required>
            <option value="">選択してください</option>
            <option>大学1年</option><option>大学2年</option><option>大学3年</option><option>大学4年</option>
            <option>修士1年</option><option>修士2年</option><option>その他</option>
          </select>
        </td></tr>
      </table>
    </div>`,

  // 事後説明（終了画面に表示）
  DEBRIEF: `
    <h3>この研究について（事後説明）</h3>
    <p>この研究は、自分自身に対する気持ち（自尊心）と、周りに合わせすぎてしまう傾向（過剰適応）との関係を調べるものです。</p>
    <p>最初に行っていただいた分類課題は「潜在連合テスト（IAT）」と呼ばれるもので、自分では意識しにくい自分へのイメージを、反応の速さから推定するためのものです。
    課題の結果は、一人ひとりの性格を判定するものではなく、多くの方の回答をまとめて統計的に分析するためだけに使います。</p>
    <p>研究の性質上、最初の説明では目的を詳しくお伝えしませんでした。ご理解いただければ幸いです。
    この研究の内容は、まだ参加していない方には話さないようお願いします。</p>
    <p>回答後に参加をとりやめたい場合や、ご質問がある場合は、参加者番号を添えて実施者までご連絡ください。</p>`,
};

/* ---------- ここから下は仕組み（ふつうは触らなくてOK）---------- */

/* 5つの独立した丸で答えるリッカート形式のプラグイン
 * - 丸どうしは線でつながっていない
 * - 丸の下に番号（1〜5）と選択肢の言葉を表示
 * - 全項目に答えるまで「次へ」で進めない（未回答の項目を赤く示してその位置へ移動） */
class LikertCirclesPlugin {
  static info = {
    name: "likert-circles",
    version: "1.0.0",
    parameters: {
      preamble: { type: ParameterType.HTML_STRING, default: "" },
      items: { type: ParameterType.COMPLEX, default: [] },   // [{id, text}]
      labels: { type: ParameterType.STRING, array: true, default: [] },
      button_label: { type: ParameterType.STRING, default: "次へ" },
    },
    data: {
      response: { type: ParameterType.OBJECT },  // {項目ID: 1〜5}
      rt: { type: ParameterType.INT },
    },
  };

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const n = trial.labels.length;
    const opts = (it) =>
      trial.labels
        .map((lab, k) => `
          <label class="lc-opt">
            <input type="radio" name="${it.id}" value="${k + 1}">
            <span class="lc-circle" aria-hidden="true"></span>
            <span class="lc-num">${k + 1}</span>
            <span class="lc-lab">${lab}</span>
          </label>`)
        .join("");
    const rows = trial.items
      .map((it, i) => `
        <fieldset class="lc-item" id="lc-${it.id}">
          <legend class="lc-text"><span class="lc-no">${i + 1}.</span>${it.text}</legend>
          <div class="lc-opts" style="--n:${n}">${opts(it)}</div>
        </fieldset>`)
      .join("");

    display_element.innerHTML = `
      ${trial.preamble}
      <form class="lc-form" novalidate>
        ${rows}
        <p class="lc-msg warn" hidden>まだ回答していない質問があります（赤枠の質問）。</p>
        <div class="center"><button type="submit" class="jspsych-btn">${trial.button_label}</button></div>
      </form>`;
    window.scrollTo(0, 0);

    const form = display_element.querySelector("form");
    const msg = display_element.querySelector(".lc-msg");
    const t0 = performance.now();

    form.addEventListener("change", (e) => {
      const fs = e.target.closest(".lc-item");
      if (fs) fs.classList.remove("lc-missing");
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const response = {};
      let firstMissing = null;
      trial.items.forEach((it) => {
        const checked = form.querySelector(`input[name="${it.id}"]:checked`);
        const fs = form.querySelector(`#lc-${it.id}`);
        if (checked) {
          response[it.id] = Number(checked.value);
          fs.classList.remove("lc-missing");
        } else {
          fs.classList.add("lc-missing");
          if (!firstMissing) firstMissing = fs;
        }
      });
      if (firstMissing) {
        msg.hidden = false;
        firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      this.jsPsych.finishTrial({ response, rt: Math.round(performance.now() - t0) });
    });
  }
}

// 尺度ごとのページを作る（提示順は items の並び順のまま）
function buildQuestionnaireTimeline() {
  const pages = [];
  QUESTIONNAIRE.SCALES.forEach((sc) => {
    const nPages = Math.ceil(sc.items.length / sc.per_page);
    for (let p = 0; p < nPages; p++) {
      const chunk = sc.items.slice(p * sc.per_page, (p + 1) * sc.per_page);
      pages.push({
        type: LikertCirclesPlugin,
        preamble: `<div class="instr q-pre"><p>${sc.instruction}</p>${nPages > 1 ? `<p class="small center">（${p + 1} / ${nPages} ページ）</p>` : ""}</div>`,
        items: chunk.map(({ id, text }) => ({ id, text })),
        labels: sc.labels,
        button_label: "次へ",
        data: { task: "questionnaire", scale: sc.id, page: p + 1 },
      });
    }
  });
  pages.push({
    type: jsPsychSurveyHtmlForm,
    html: QUESTIONNAIRE.DEMOGRAPHICS,
    button_label: "回答を送信する",
    data: { task: "demographics" },
  });
  return pages;
}

const qMean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : "");
const qSum = (a) => a.reduce((s, x) => s + x, 0);

// 回答をまとめて、スプレッドシートに書く1行分のデータにする
// 列：各項目の素点（逆転前、1〜5）→ 尺度・側面・下位尺度の得点 → 注意確認 → フェイス項目
function collectQuestionnaire(jsPsych) {
  const raw = {};
  jsPsych.data.get().filter({ task: "questionnaire" }).values().forEach((d) => Object.assign(raw, d.response));
  const out = {};
  const checks = [];
  QUESTIONNAIRE.SCALES.forEach((sc) => {
    const n = sc.labels.length;
    const scored = sc.items.filter((it) => !it.check);
    const val = (it) => (typeof raw[it.id] === "number" ? (it.reverse ? n + 1 - raw[it.id] : raw[it.id]) : null);
    // 素点は項目番号順（r01〜r10、a01〜a33）で並べる
    [...scored].sort((a, b) => a.id.localeCompare(b.id)).forEach((it) => (out[it.id] = raw[it.id] ?? ""));
    const v = scored.map(val).filter((x) => x !== null);
    out[`${sc.id}_n_missing`] = scored.length - v.length;
    out[`${sc.id}_total`] = v.length === scored.length ? qSum(v) : "";
    out[`${sc.id}_mean`] = qMean(v);
    // 側面（外的・内的）ごとの平均
    [...new Set(scored.map((it) => it.side).filter(Boolean))].forEach((side) => {
      out[`${sc.id}_${side}_mean`] = qMean(scored.filter((it) => it.side === side).map(val).filter((x) => x !== null));
    });
    // 下位尺度ごとの平均
    [...new Set(scored.map((it) => it.sub).filter(Boolean))].forEach((sub) => {
      out[`${sc.id}_${sub}_mean`] = qMean(scored.filter((it) => it.sub === sub).map(val).filter((x) => x !== null));
    });
    // 注意確認項目
    sc.items.filter((it) => it.check).forEach((it) => {
      out[it.id] = raw[it.id] ?? "";
      out[`${it.id}_pass`] = raw[it.id] === it.check;
      checks.push(out[`${it.id}_pass`]);
    });
  });
  out.attention_all_pass = checks.every(Boolean);
  const pages = jsPsych.data.get().filter({ task: "questionnaire" }).values();
  out.questionnaire_rt_sec = Math.round(pages.reduce((s, d) => s + (d.rt || 0), 0) / 1000);
  const demo = jsPsych.data.get().filter({ task: "demographics" }).values()[0];
  if (demo) {
    out.sex = demo.response.sex ?? "";
    out.age = demo.response.age ?? "";
    out.grade = demo.response.grade ?? "";
  }
  return out;
}
