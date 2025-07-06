import { w as slot } from "../../chunks/index.js";
function _layout($$payload, $$props) {
  $$payload.out += `<div class="app svelte-1n3ftnu"><header class="svelte-1n3ftnu"><nav class="svelte-1n3ftnu"><a href="/" class="svelte-1n3ftnu">Home</a></nav></header> <main class="svelte-1n3ftnu"><!---->`;
  slot($$payload, $$props, "default", {});
  $$payload.out += `<!----></main> <footer class="svelte-1n3ftnu"><p>© 2024 SvelteKit App</p></footer></div>`;
}
export {
  _layout as default
};
