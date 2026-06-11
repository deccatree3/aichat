const fs = require('fs')
const path = require('path')
const { OUT, launch, settle, shot } = require('./lib')

const BASE = 'https://zeta-ai.io'
const LOGFILE = path.join(OUT, 'capture-log.json')

function loadLog() {
  try {
    return JSON.parse(fs.readFileSync(LOGFILE, 'utf8'))
  } catch {
    return []
  }
}

async function looksLoggedIn(ctx) {
  const cookies = await ctx.cookies(BASE)
  return cookies.some((cookie) => /(token|session|auth|sid|access|refresh)/i.test(cookie.name) && (cookie.value || '').length > 20)
}

async function main() {
  const { browser, ctx, page } = await launch()
  await page.goto(`${BASE}/ko/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  console.log('Opened Chrome. Log in manually; capture starts after auth cookies are detected.')

  const deadline = Date.now() + 10 * 60 * 1000
  while (Date.now() < deadline) {
    await page.waitForTimeout(3000)
    if (await looksLoggedIn(ctx).catch(() => false)) break
  }

  if (!(await looksLoggedIn(ctx).catch(() => false))) {
    console.log('Login was not detected within 10 minutes.')
    await browser.close()
    process.exit(3)
  }

  const log = loadLog()
  const base = log.length
  let index = 0
  const steps = [
    ['auth-mypage', '/ko/my-page', '로그인 상태 마이페이지'],
    ['auth-more-menu', '/ko/more', '로그인 상태 더보기 메뉴'],
    ['auth-settings-account', '/ko/settings/account', '로그인 상태 계정 설정'],
    ['auth-settings-notification', '/ko/settings/notification', '로그인 상태 알림 설정'],
    ['auth-notification', '/ko/notification', '로그인 상태 알림'],
  ]

  for (const [slug, url, situation] of steps) {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await settle(page)
    await shot(page, log, base + ++index, slug, situation, 'auth')
  }

  await browser.close()
}

main().catch((error) => {
  console.error('FATAL', error)
  process.exit(1)
})

