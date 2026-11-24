/* =========================================================
 * 質問紙の設定（IATのあとに続けて回答してもらう）
 * 項目の文言・順番・逆転項目はここで管理します。
 * 回答は IAT の結果と一緒に送信され、スプレッドシートの summary シートに
 * 参加者番号ごとの1行（Dスコア＋全項目＋尺度得点）として保存されます。
 * ========================================================= */
const LIKERT5 = ["あてはまらない", "ややあてはまらない", "どちらともいえない", "ややあてはまる", "あてはまる"];

const QUESTIONNAIRE = {
  // IATが終わったあとの切り替え画面
  INTRO: `<h2>課題は終了です</h2>
    <p>おつかれさまでした。続いて、いくつかの質問にお答えください。</p>
    <p>マウスで回答を選び、各ページの下にある「次へ」を押して進んでください。<br>
    正しい答えや間違った答えはありません。あまり深く考えず、あなたに一番近いものを選んでください。</p>`,

  SCALES: [
    {
      id: "rse",
      name: "Rosenberg自尊感情尺度（山本・松井・山成, 1982）",
      instruction: "次の文章は、あなた自身にどのくらいあてはまりますか。もっとも近いものを1つ選んでください。",
      labels: LIKERT5,
      per_page: 10,
      // ※ 文言は原典（山本・松井・山成, 1982）と必ず照合してください
      items: [
        { id: "rse01", text: "少なくとも人並みには、価値のある人間である" },
        { id: "rse02", text: "色々な良い素質をもっている" },
        { id: "rse03", text: "敗北者だと思うことがよくある", reverse: true },
        { id: "rse04", text: "物事を人並みには、うまくやれる" },
        { id: "rse05", text: "自分には、自慢できるところがあまりない", reverse: true },
        { id: "rse06", text: "自分に対して肯定的である" },
        { id: "rse07", text: "だいたいにおいて、自分に満足している" },
        { id: "rse08", text: "もっと自分自身を尊敬できるようになりたい", reverse: true },
        { id: "rse09", text: "自分は全くだめな人間だと思うことがある", reverse: true },
        { id: "rse10", text: "何かにつけて、自分は役に立たない人間だと感じる", reverse: true },
      ],
      // 注意確認項目：この位置（何番目の項目の後か）に差し込む。correct は正答の選択肢番号（1〜5）
      attention: { after: 6, id: "ac1", text: "この項目では「ややあてはまらない」を選んでください", correct: 2 },
    },
    {
      id: "oa",
      name: "過剰適応尺度（石津, 2006；石津・安保, 2008）",
      instruction: "次の文章は、ふだんのあなたにどのくらいあてはまりますか。もっとも近いものを1つ選んでください。",
      labels: LIKERT5,
      per_page: 11,
      // ※ 項目の文言・下位尺度（sub）・逆転項目は原典の内容に差し替えてください（今は仮の文言です）
      //   sub の名前ごとに平均点が自動で計算されます
      items: Array.from({ length: 33 }, (_, i) => ({
        id: "oa" + String(i + 1).padStart(2, "0"),
        text: `（過剰適応尺度 項目${i + 1}：原典の文言を入れる）`,
        sub: "未設定",
      })),
      attention: { after: 20, id: "ac2", text: "この項目では「ややあてはまる」を選んでください", correct: 4 },
    },
  ],

  // フェイス項目
  DEMOGRAPHICS: `
    <div class="instr">
      <h2>あなた自身について</h2>
      <p>最後に、あなた自身についてお答えください。</p>
      <table class="demo">
        <tr><th>年齢</th><td><input type="number" name="age" min="15" max="99" required> 歳</td></tr>
        <tr><th>性別</th><td>
          <label><input type="radio" name="gender" value="男性" required> 男性</label>
          <label><input type="radio" name="gender" value="女性"> 女性</label>
          <label><input type="radio" name="gender" value="その他"> その他</label>
          <label><input type="radio" name="gender" value="回答しない"> 回答しない</label>
        </td></tr>
        <tr><th>学年</th><td>
          <select name="grade" required>
            <option value="">選択してください</option>
            <option>1年</option><option>2年</option><option>3年</option><option>4年</option>
            <option>大学院生</option><option>その他</option>
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
    <p>回答後に参加をとりやめたい場合や、ご質問がある場合は、参加者番号を添えて実施者までご連絡ください。</p>`,
};

/* ---------- ここから下は仕組み（ふつうは触らなくてOK）---------- */

// 尺度ごとのページを作る
function buildQuestionnaireTimeline() {
  const pages = [];
  QUESTIONNAIRE.SCALES.forEach((sc) => {
    const list = sc.items.map((it) => ({ ...it }));
    if (sc.attention) list.splice(sc.attention.after, 0, { ...sc.attention, isCheck: true });
    for (let i = 0; i < list.length; i += sc.per_page) {
      const chunk = list.slice(i, i + sc.per_page);
      const pageNo = Math.floor(i / sc.per_page) + 1;
      const nPages = Math.ceil(list.length / sc.per_page);
      pages.push({
        type: jsPsychSurveyLikert,
        preamble: `<div class="instr q-pre"><p>${sc.instruction}</p>${nPages > 1 ? `<p class="small center">（${pageNo} / ${nPages} ページ）</p>` : ""}</div>`,
        questions: chunk.map((it) => ({ prompt: it.text, name: it.id, labels: sc.labels, required: true })),
        scale_width: 760,
        button_label: "次へ",
        data: { task: "questionnaire", scale: sc.id },
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

// 回答をまとめて、スプレッドシートに書く1行分のデータにする
function collectQuestionnaire(jsPsych) {
  const raw = {};
  jsPsych.data.get().filter({ task: "questionnaire" }).values().forEach((d) => {
    for (const [k, v] of Object.entries(d.response)) raw[k] = v + 1; // 0〜4 → 1〜5点
  });
  const out = {};
  QUESTIONNAIRE.SCALES.forEach((sc) => {
    const n = sc.labels.length;
    const scored = sc.items.map((it) => (it.reverse ? n + 1 - raw[it.id] : raw[it.id]));
    sc.items.forEach((it) => (out[it.id] = raw[it.id])); // 素点（逆転前）
    out[`${sc.id}_total`] = scored.reduce((s, x) => s + x, 0);
    out[`${sc.id}_mean`] = qMean(scored);
    const subs = [...new Set(sc.items.map((it) => it.sub).filter(Boolean))];
    subs.forEach((sub) => {
      const v = sc.items.filter((it) => it.sub === sub).map((it) => (it.reverse ? n + 1 - raw[it.id] : raw[it.id]));
      out[`${sc.id}_${sub}_mean`] = qMean(v);
    });
    if (sc.attention) {
      out[sc.attention.id] = raw[sc.attention.id];
      out[`${sc.attention.id}_pass`] = raw[sc.attention.id] === sc.attention.correct;
    }
  });
  const checks = QUESTIONNAIRE.SCALES.filter((sc) => sc.attention).map((sc) => out[`${sc.attention.id}_pass`]);
  out.attention_all_pass = checks.every(Boolean);
  const demo = jsPsych.data.get().filter({ task: "demographics" }).values()[0];
  if (demo) Object.assign(out, demo.response);
  return out;
}
