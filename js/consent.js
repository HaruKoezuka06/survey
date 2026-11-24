/* =========================================================
 * 研究参加の説明と同意（署名）画面
 * - 署名（同意日・大学名・学籍番号・氏名）は jsPsych のデータには一切残さず、
 *   この画面の中だけで保持する。参加者番号が確定した時点で consent シートにだけ送信する。
 * - summary・trials_all・参加者番号シートには、氏名・学籍番号・大学名は入らない。
 * ========================================================= */

// 設定が空欄のときは赤字で［未設定］と出して、公開前に気づけるようにする
function cfg(v, label) {
  return v ? esc(v) : `<span class="unset">［${label}：未設定］</span>`;
}

function contactHtml() {
  return `関西大学 ${cfg(C.AFFILIATION, "所属")} 4年　${esc(C.RESEARCHER)}（${cfg(C.EMAIL, "大学メールアドレス")}）／指導教員：${cfg(C.SUPERVISOR, "指導教員名")}`;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 全角英数字→半角、空白除去、英字は大文字
function toHalfWidth(v) {
  return String(v || "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/[\s　]/g, "")
    .toUpperCase();
}

let CONSENT = null; // { consent_date, university, student_id, name }（画面内でのみ保持）
let consentSaved = false;

class ConsentPlugin {
  static info = { name: "consent-form", version: "1.0.0", parameters: {}, data: {} };

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element) {
    display_element.innerHTML = `
      <div class="instr consent">
        <h2>研究参加についての説明と同意</h2>
        <p class="center"><b>研究題目：${esc(C.STUDY_TITLE)}</b></p>

        <p><b>内容</b>　画面に出る言葉をキーで分類する課題（約${C.TASK_MIN}分）と質問紙（約${C.QUESTIONNAIRE_MIN}分）に取り組んでいただきます。所要時間は約${C.TOTAL_MIN}分です。詳しい目的は、終了後に説明します。対象は18歳以上の方です。${C.REWARD_TEXT ? esc(C.REWARD_TEXT) : ""}</p>

        <p><b>参加は自由です</b>　参加しなくても、途中でやめても、不利益は一切ありません。やめたいときは、画面右下の「実験をやめる」ボタンを押すか、ブラウザを閉じてください。それまでの回答は使いません。答えたくない質問には、答えなくてかまいません。</p>

        <p><b>データの扱い</b>　回答は匿名で分析し、卒業論文と学内発表で統計的にまとめた形でのみ公表します。大学名・学籍番号・氏名は同意の記録にだけ使い、回答とは別に保管します。データは${esc(C.DISPOSAL_TIMING)}に破棄します。</p>

        <p><b>同意の取り消し</b>　${cfg(C.DELETE_DEADLINE, "削除受付の期日")}までに、終了画面に表示される参加者番号を下記へ連絡すれば、データを削除します。</p>

        <p><b>問い合わせ先</b>　${contactHtml()}</p>

        <div class="sign">
          <h3>署名</h3>
          <p>上記の説明を読んで理解し、研究への参加に同意します。</p>
          <table class="demo">
            <tr><th>同意日</th><td><input type="date" id="c-date" value="${todayStr()}"></td></tr>
            <tr><th>大学名</th><td><input type="text" id="c-univ" value="${esc(C.DEFAULT_UNIVERSITY)}" autocomplete="off">
              <div class="small">他大学の方は書き換えてください</div></td></tr>
            <tr><th>学籍番号</th><td><input type="text" id="c-sid" autocomplete="off">
              <div class="small" id="c-sid-hint"></div></td></tr>
            <tr><th>氏名</th><td><input type="text" id="c-name" autocomplete="off"></td></tr>
          </table>
        </div>

        <div class="center consent-actions">
          <button type="button" class="jspsych-btn" id="c-agree" disabled>同意して開始する</button>
          <button type="button" class="jspsych-btn" id="c-decline">参加しない</button>
        </div>
      </div>`;

    const $ = (id) => display_element.querySelector("#" + id);
    const sidRe = new RegExp(C.STUDENT_ID_PATTERN);

    const read = () => ({
      consent_date: $("c-date").value,
      university: $("c-univ").value.trim(),
      student_id: toHalfWidth($("c-sid").value),
      name: $("c-name").value.trim(),
    });

    const validate = () => {
      const v = read();
      const kansai = v.university.replace(/[\s　]/g, "") === "関西大学";
      let sidOk = v.student_id !== "";
      const hint = $("c-sid-hint");
      hint.className = "small";
      hint.textContent = kansai ? C.STUDENT_ID_HINT : "";
      if (kansai && v.student_id && !sidRe.test(v.student_id)) {
        sidOk = false;
        hint.className = "small warn";
        hint.textContent = "学籍番号の形式が正しくありません。" + C.STUDENT_ID_HINT;
      }
      const ok = v.consent_date && v.university && sidOk && v.name;
      $("c-agree").disabled = !ok;
      return ok;
    };

    ["c-date", "c-univ", "c-sid", "c-name"].forEach((id) => $(id).addEventListener("input", validate));
    validate();

    $("c-agree").addEventListener("click", () => {
      if (!validate()) return;
      CONSENT = read();
      this.jsPsych.finishTrial({ consented: true }); // 署名の中身はデータに残さない
    });
    $("c-decline").addEventListener("click", () => {
      CONSENT = null;
      this.jsPsych.abortExperiment(`<div class="instr"><h2>ありがとうございました</h2>
        <p>研究への参加は見送りとなりました。回答は何も送信されていません。</p>
        <p>このページを閉じてください。</p></div>`);
    });
  }
}

// 参加者番号が確定したら、同意の記録だけを consent シートに送る
let consentInflight = null; // 送信中に二重送信しないため
function sendConsent() {
  if (consentInflight) return consentInflight;
  consentInflight = sendConsentOnce().then((ok) => {
    if (!ok) consentInflight = null; // 失敗したら次の呼び出しで再送できるようにする
    return ok;
  });
  return consentInflight;
}

async function sendConsentOnce() {
  if (!CONSENT || consentSaved || !C.GAS_URL) return consentSaved;
  const payload = {
    type: "consent",
    pid: PID,
    ...CONSENT,
    consent_version: C.CONSENT_VERSION,
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(C.GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });
      const json = await res.json();
      if (json.status === "ok") {
        consentSaved = true;
        CONSENT = null; // 送信できたら手元からも消す
        return true;
      }
    } catch (e) {
      console.warn("consent save failed", attempt, e);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return false;
}
