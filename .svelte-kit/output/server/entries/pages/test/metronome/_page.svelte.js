import { A as current_component, F as ensure_array_like, G as attr, J as attr_class, y as escape_html, K as stringify, v as pop, t as push } from "../../../../chunks/index.js";
function onDestroy(fn) {
  var context = (
    /** @type {Component} */
    current_component
  );
  (context.d ??= []).push(fn);
}
function _page($$payload, $$props) {
  push();
  let bpm = 120;
  let upper = 4;
  let lower = 4;
  let subDivisions = 2;
  let customGroupingStr = "";
  let variableSubDivisionsStr = "";
  let running = false;
  let pulses = [];
  let pulseSquares = [];
  onDestroy(() => {
  });
  const each_array = ensure_array_like(pulseSquares);
  $$payload.out += `<h1>Metronome Functional Test</h1> <div class="controls svelte-14lopyi"><div class="control-group svelte-14lopyi"><label for="bpm">Tempo (BPM)</label> <input id="bpm" type="number" min="20" max="400"${attr("value", bpm)}/></div> <div class="control-group svelte-14lopyi"><label for="upper">Time Signature Upper</label> <input id="upper" type="number" min="1" max="32"${attr("value", upper)}/></div> <div class="control-group svelte-14lopyi"><label for="lower">Time Signature Lower</label> <input id="lower" type="number" min="1" max="32" step="1"${attr("value", lower)}/></div> <div class="control-group svelte-14lopyi"><label for="subDivisions">Subdivisions</label> <input id="subDivisions" type="number" min="1" max="16"${attr("value", subDivisions)}/></div> <div class="control-group svelte-14lopyi"><label for="customGrouping">Custom Grouping<br/><small>(comma-separated, e.g. 3,2,2)</small></label> <input id="customGrouping" type="text"${attr("value", customGroupingStr)}/></div> <div class="control-group svelte-14lopyi"><label for="variableSubDivisions">Variable Subdivisions<br/><small>(comma-separated, e.g. 2,3,2)</small></label> <input id="variableSubDivisions" type="text"${attr("value", variableSubDivisionsStr)}/></div> <div class="control-group svelte-14lopyi"><button${attr("disabled", running, true)}>Start</button> <button${attr("disabled", !running, true)}>Stop</button></div></div> <div class="pulse-row svelte-14lopyi"><!--[-->`;
  for (let i = 0, $$length = each_array.length; i < $$length; i++) {
    let sq = each_array[i];
    $$payload.out += `<div${attr_class(`pulse-square ${stringify(sq.isActive ? "active" : "")}`, "svelte-14lopyi")}${attr("title", `Pulse ${stringify(sq.pulse)}`)}>${escape_html(sq.pulse)}</div>`;
  }
  $$payload.out += `<!--]--></div> `;
  {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> `;
  if (pulses.length > 0) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<details><summary>Pulse Log (${escape_html(pulses.length)})</summary> <pre style="max-height: 200px; overflow: auto;">${escape_html(pulses.map((p) => `M:${p.measure} B:${p.beat} P:${p.pulse} S:${p.subdivs} NewBeat:${p.isNewBeat}`).join("\n"))}
    </pre></details>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]-->`;
  pop();
}
export {
  _page as default
};
