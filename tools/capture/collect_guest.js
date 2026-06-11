const { launch, settle, shot } = require('./lib')

const BASE = 'https://zeta-ai.io'
const PLOT = '/ko/plots/b74b5b3a-d11d-43fb-a160-4a67d4ec91e5/profile'

async function tryClick(page, locator, ms = 2800) {
  try {
    await locator.click({ timeout: 6000 })
    await settle(page, ms)
    return true
  } catch {
    return false
  }
}

async function main() {
  const { browser, page } = await launch()
  const log = []
  let n = 0

  await page.goto(`${BASE}/ko`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await settle(page, 3500)
  await shot(page, log, ++n, 'home-guest-entry-notice-modal', '첫 진입 시 게스트 안내/확인 모달')
  await tryClick(page, page.getByRole('button', { name: /확인|동의|시작|입장/ }).first())

  await shot(page, log, ++n, 'home-main-feed', '메인 홈 추천 플롯 카드 피드')
  await page.goto(`${BASE}/ko?tab=ranking`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await settle(page)
  await shot(page, log, ++n, 'home-ranking-tab', '홈 상단 랭킹 탭')

  await page.goto(`${BASE}/ko/search`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await settle(page)
  await shot(page, log, ++n, 'search-empty', '검색 빈 상태')
  await page.goto(`${BASE}/ko/search?keyword=%EB%A1%9C%EB%A7%A8%EC%8A%A4&source=SEARCH`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await settle(page)
  await shot(page, log, ++n, 'search-results', '로맨스 검색 결과')

  await page.goto(`${BASE}/ko/notification`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await settle(page)
  await shot(page, log, ++n, 'notification-guest', '게스트 알림 화면')

  await page.goto(BASE + PLOT, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await settle(page)
  await shot(page, log, ++n, 'plot-profile-detail', '플롯 상세/프로필')
  await tryClick(page, page.getByRole('button', { name: /대화 시작|첫 대화/ }).first())
  await shot(page, log, ++n, 'login-required-bottomsheet', '로그인 필요 액션 후 로그인 유도 바텀시트')

  for (const [slug, url, situation] of [
    ['login-page-full', '/ko/login', '로그인 전체 페이지'],
    ['mypage-guest', '/ko/my-page', '게스트 마이페이지'],
    ['more-settings-menu', '/ko/more', '더보기/설정 메뉴'],
    ['piece-charge', '/ko/piece/charge', '피스 충전'],
    ['piece-history', '/ko/piece/history', '피스 내역'],
    ['announcements-list', '/ko/announcements', '공지사항 목록'],
    ['support-center', '/ko/support', '고객센터'],
  ]) {
    await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await settle(page)
    await shot(page, log, ++n, slug, situation)
  }

  await browser.close()
}

main().catch((error) => {
  console.error('FATAL', error)
  process.exit(1)
})

