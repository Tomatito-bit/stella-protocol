// Browser smoke test: plays the real UI in headless Chrome and fails on any runtime error.
// Needs the dev server running (npm run dev). Run: node scripts/check-ui.mjs
import { spawn } from 'node:child_process'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.BASE || 'http://localhost:5173'
const PORT = 9337

const chrome = spawn(CHROME, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', `--remote-debugging-port=${PORT}`, `--user-data-dir=${process.env.TEMP || '/tmp'}/stella-check-ui`, '--window-size=1400,860', 'about:blank'], { stdio: 'ignore' })
let target
for (let i = 0; i < 50 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await sleep(200) } }
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let id = 0
const pending = new Map()
const errors = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id) }
  else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description?.split('\n')[0] || m.params.exceptionDetails.text)
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value || a.description).join(' ').split('\n')[0])
}
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value
const click = (text) => ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(${JSON.stringify(text)}) && !x.disabled); if (b) { b.click(); return true } return false })()`)
const waitClick = async (text, tries = 40) => { for (let i = 0; i < tries; i++) { if (await click(text)) return true; await sleep(500) } return false }
let fails = 0
const ok = (cond, msg) => { console.log(`${cond ? '  ✓' : '  ✗'} ${msg}`); if (!cond) fails++ }
const state = (expr) => ev(`(() => { const s = window.__game.getState(); return ${expr} })()`)

await send('Runtime.enable')
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 860, deviceScaleFactor: 1, mobile: false })

for (const dest of ['mars', 'moon', 'europa']) {
  console.log(`\n== ${dest}`)
  errors.length = 0
  await send('Page.navigate', { url: `${BASE}/?demo=review&dest=${dest}` })
  ok(await waitClick('Lanzar'), 'la revisión deja lanzar')
  await sleep(3000)
  ok(await waitClick('Saltar', 10), 'se puede saltar el despegue')
  await sleep(1500)
  ok(await waitClick('Comenzar la misión', 10), 'el prólogo lleva a la misión')
  await sleep(4000)
  ok((await state('s.screen')) === 'mission', 'la pantalla es la misión')
  ok(await ev(`document.querySelectorAll('canvas').length > 0`), 'se dibuja la escena 3D')
  for (let i = 0; i < 4; i++) { if (!(await click(i < 3 ? 'Siguiente' : 'Entendido'))) break; await sleep(300) }
  if (!(await state('s.journalOpen'))) await ev(`document.querySelector('.closed-logbook')?.click()`)
  await sleep(1500)
  ok(await ev(`!!document.querySelector('.logbook')`), 'la bitácora se abre')
  for (let p = 0; p < 2; p++) { await click('Siguiente página'); await sleep(1200) }
  ok(await ev(`!!document.querySelector('.logbook')`), 'se hojean todas las páginas')
  if (await state('!!s.mission.explore')) {
    await click('Ver la nave'); await click('Página anterior')
    await ev(`window.__game.getState().closeJournal(); window.__game.getState().setView('surface')`)
    await sleep(2500)
    ok(await ev(`document.querySelectorAll('canvas').length > 0`), 'la vista de superficie se dibuja')
  }
  ok(errors.length === 0, `sin errores en la consola${errors.length ? ': ' + errors.slice(0, 2).join(' | ') : ''}`)
}
ws.close()
chrome.kill()
console.log(fails ? `\n${fails} fallas` : '\nTodo bien en el navegador')
process.exit(fails ? 1 : 0)
