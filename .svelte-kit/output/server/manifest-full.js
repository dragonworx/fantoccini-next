export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png"]),
	mimeTypes: {".png":"image/png"},
	_: {
		client: {start:"_app/immutable/entry/start.DX3fnfGN.js",app:"_app/immutable/entry/app.CTPHtOjy.js",imports:["_app/immutable/entry/start.DX3fnfGN.js","_app/immutable/chunks/6zrCZpRx.js","_app/immutable/chunks/DRmIJLM6.js","_app/immutable/chunks/BliMQmZ6.js","_app/immutable/chunks/gbrRaw8B.js","_app/immutable/entry/app.CTPHtOjy.js","_app/immutable/chunks/BliMQmZ6.js","_app/immutable/chunks/gbrRaw8B.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DRmIJLM6.js","_app/immutable/chunks/Dwdb2LrM.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/test/metronome",
				pattern: /^\/test\/metronome\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
