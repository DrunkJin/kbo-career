import { buildSync } from 'esbuild';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const code = buildSync({ stdin: { contents: 'export * from "./src/game/engine"; export * from "./src/game/store"; export * from "./src/game/data"; export * from "./src/game/events";', resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'cjs', write: false, define: { 'import.meta.env.BASE_URL': '"/kbo-career/"' } }).outputFiles[0].text;
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
export const game = mod.exports;
export function seeded(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
