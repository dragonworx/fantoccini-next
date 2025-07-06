import { z as head, y as escape_html } from "../../chunks/index.js";
function _page($$payload) {
  let count = 0;
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Welcome to SvelteKit</title>`;
    $$payload2.out += `<meta name="description" content="SvelteKit app with TypeScript"/>`;
  });
  $$payload.out += `<section class="svelte-rtidbq"><h1 class="svelte-rtidbq">Welcome to SvelteKit!</h1> <p>This is your SvelteKit app with TypeScript support.</p> <div class="counter svelte-rtidbq"><h2 class="svelte-rtidbq">Counter: ${escape_html(count)}</h2> <div class="buttons svelte-rtidbq"><button class="svelte-rtidbq">-</button> <button class="svelte-rtidbq">Reset</button> <button class="svelte-rtidbq">+</button></div></div> <div class="info svelte-rtidbq"><p>Visit <a href="https://kit.svelte.dev" class="svelte-rtidbq">kit.svelte.dev</a> to read the documentation</p></div></section>`;
}
export {
  _page as default
};
