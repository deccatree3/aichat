const { chromium } = require('playwright')
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')
const OUT = path.join(ROOT, 'docs', 'reference', 'screenshots')
fs.mkdirSync(OUT, { recursive: true })

function winshot(outPath) {
  const result = execFileSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.join(__dirname, 'winshot.ps1'),
    '-Out',
    outPath,
  ], { encoding: 'utf8' })
  return result.trim()
}

async function launch() {
  const browser = await chromium.launch({
    headless: false,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--window-size=1720,1392',
      '--window-position=0,0',
      '--no-first-run',
      '--disable-infobars',
      '--disable-blink-features=AutomationControlled',
      '--hide-crash-restore-bubble',
    ],
  })
  const ctx = await browser.newContext({ viewport: null, locale: 'ko-KR' })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  return { browser, ctx, page }
}

async function settle(page, ms = 2800) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 30000 })
  } catch {}
  await page.waitForTimeout(ms)
}

async function shot(page, log, num, slug, situation, phase = 'guest') {
  const nn = String(num).padStart(2, '0')
  const file = `zeta_${nn}-${slug}.png`
  let result = ''
  try {
    result = winshot(path.join(OUT, file))
  } catch (error) {
    result = `CAPTURE_ERR ${String(error.message || '').slice(0, 80)}`
  }
  const entry = { num: nn, phase, file, url: page.url(), title: await page.title().catch(() => ''), situation }
  log.push(entry)
  fs.writeFileSync(path.join(OUT, 'capture-log.json'), JSON.stringify(log, null, 2), 'utf8')
  console.log(`[${nn}] ${slug} ${entry.url} -> ${result.includes('CAPTURED') ? 'ok' : result}`)
  return entry
}

module.exports = { OUT, launch, settle, shot }

