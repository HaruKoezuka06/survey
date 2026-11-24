/* =========================================================
 * IAT用の自作jsPsychプラグイン（jsPsych 8）
 * - キー判定は event.code（物理キー）で行うため、日本語IMEがONでも反応する
 * - 誤答時は✕を表示し、正しいキーを押すまで進まない（Greenwald et al., 2003）
 * - 最初の反応のRTと、正答までのRT（誤答ペナルティ込み）を両方記録する
 * ========================================================= */
const { ParameterType } = jsPsychModule;

// 「実験をやめる」の確認画面が開いている間はキー入力を受け付けない
// count：確認画面が開かれた回数（試行中に開かれたら、その試行を「中断あり」として記録する）
window.IAT_PAUSE = { paused: false, aborted: false, count: 0 };

function keyCodeOf(letter) {
  return "Key" + letter.toUpperCase();
}

class IatTrialPlugin {
  static info = {
    name: "iat-trial",
    version: "1.0.0",
    parameters: {
      stimulus: { type: ParameterType.STRING, default: undefined },
      stim_class: { type: ParameterType.STRING, default: "target" }, // target / attribute
      correct_side: { type: ParameterType.STRING, default: "left" }, // left / right
      left_labels: { type: ParameterType.COMPLEX, default: [] },     // [{text, cls}]
      right_labels: { type: ParameterType.COMPLEX, default: [] },
      left_key: { type: ParameterType.STRING, default: "E" },
      right_key: { type: ParameterType.STRING, default: "I" },
    },
    data: {
      stimulus: { type: ParameterType.STRING },
      stim_class: { type: ParameterType.STRING },
      correct_side: { type: ParameterType.STRING },
      rt: { type: ParameterType.FLOAT },          // 最初の反応までの時間
      correct: { type: ParameterType.BOOL },      // 最初の反応が正答か
      rt_correct: { type: ParameterType.FLOAT },  // 正答キーを押すまでの時間（誤答時は押し直し込み）
      n_errors: { type: ParameterType.INT },
      interrupted: { type: ParameterType.BOOL }, // 試行中に「実験をやめる」の確認画面が開かれたか
      response_side: { type: ParameterType.STRING },
    },
  };

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    const labelHtml = (labels) =>
      labels
        .map((l) => `<span class="cat ${l.cls}">${l.text}</span>`)
        .join('<span class="or">または</span>');

    display_element.innerHTML = `
      <div class="iat-wrap">
        <div class="iat-label left"><div class="key">${trial.left_key}</div>${labelHtml(trial.left_labels)}</div>
        <div class="iat-label right"><div class="key">${trial.right_key}</div>${labelHtml(trial.right_labels)}</div>
        <div class="iat-stim ${trial.stim_class}">${trial.stimulus}</div>
        <div class="iat-error" id="iat-error">✕</div>
        <div class="iat-bottom">間違えると赤い ✕ が出ます。正しいキーを押し直すと次に進みます。</div>
      </div>`;

    const leftCode = keyCodeOf(trial.left_key);
    const rightCode = keyCodeOf(trial.right_key);
    const correctCode = trial.correct_side === "left" ? leftCode : rightCode;
    const errEl = display_element.querySelector("#iat-error");

    let t0 = null;
    const pauseCountAtStart = window.IAT_PAUSE.count;
    let first = null;
    let nErrors = 0;

    const onKey = (e) => {
      if (e.repeat || t0 === null || window.IAT_PAUSE.paused) return;
      if (window.IAT_PAUSE.aborted) return document.removeEventListener("keydown", onKey);
      if (e.code !== leftCode && e.code !== rightCode) return;
      e.preventDefault();
      const t = performance.now() - t0;
      const side = e.code === leftCode ? "left" : "right";
      if (first === null) first = { rt: t, side, correct: e.code === correctCode };
      if (e.code === correctCode) {
        document.removeEventListener("keydown", onKey);
        this.jsPsych.finishTrial({
          stimulus: trial.stimulus,
          stim_class: trial.stim_class,
          correct_side: trial.correct_side,
          rt: Math.round(first.rt),
          correct: first.correct,
          rt_correct: Math.round(t),
          n_errors: nErrors,
          interrupted: window.IAT_PAUSE.count !== pauseCountAtStart,
          response_side: first.side,
        });
      } else {
        nErrors++;
        errEl.style.visibility = "visible";
      }
    };

    document.addEventListener("keydown", onKey);
    // 刺激が実際に描画されたタイミングから計測する
    requestAnimationFrame(() => requestAnimationFrame(() => (t0 = performance.now())));
  }
}

class SpaceScreenPlugin {
  static info = {
    name: "space-screen",
    version: "1.0.0",
    parameters: {
      html: { type: ParameterType.HTML_STRING, default: "" },
      prompt: { type: ParameterType.STRING, default: "準備ができたら スペースキー を押して始めてください" },
    },
    data: {},
  };

  constructor(jsPsych) {
    this.jsPsych = jsPsych;
  }

  trial(display_element, trial) {
    display_element.innerHTML = `<div class="instr">${trial.html}<p class="go">${trial.prompt}</p></div>`;
    const onKey = (e) => {
      if (window.IAT_PAUSE.aborted) return document.removeEventListener("keydown", onKey);
      if (e.repeat || e.code !== "Space" || window.IAT_PAUSE.paused) return;
      e.preventDefault();
      document.removeEventListener("keydown", onKey);
      this.jsPsych.finishTrial({});
    };
    // 前の画面のキー押下が残っても反応しないよう少し待つ
    setTimeout(() => document.addEventListener("keydown", onKey), 300);
  }
}
