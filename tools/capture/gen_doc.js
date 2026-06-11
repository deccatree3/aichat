const fs = require('fs')
const path = require('path')

const OUT = path.resolve(__dirname, '..', '..', 'docs', 'reference', 'screenshots')
const log = JSON.parse(fs.readFileSync(path.join(OUT, 'capture-log.json'), 'utf8'))

let md = '# Zeta-AI UI/UX 벤치마킹 캡처 가이드\n\n'
md += '> 어떤 URL과 상황에서 캡처했는지 정리한 참조 문서입니다.\n\n'
md += '- 캡처 방식: headed Chrome 창 단위 캡처, Win32 PrintWindow\n'
md += '- 레이아웃: 모바일 우선, PC에서도 중앙 정렬 모바일 컬럼\n'
md += '- 로그인: 카카오 / Google / Apple OAuth\n\n'

for (const [phase, title] of [['guest', '비로그인/게스트 화면'], ['auth', '로그인 화면']]) {
  const rows = log.filter((row) => row.phase === phase)
  if (!rows.length) continue
  md += `## ${title} (${rows.length}종)\n\n`
  md += '| # | 스크린샷 | URL | 상황 |\n|---|---|---|---|\n'
  for (const row of rows) {
    const situation = String(row.situation || '').replace(/\|/g, '\\|')
    md += `| ${row.num} | [\`${row.file}\`](./${encodeURIComponent(row.file)}) | \`${row.url}\` | ${situation} |\n`
  }
  md += '\n'
}

md += '## 사용 방법\n\n'
md += '```powershell\n'
md += 'npm run capture:guest\n'
md += 'npm run capture:auth\n'
md += 'npm run capture:doc\n'
md += '```\n'

fs.writeFileSync(path.join(OUT, 'CAPTURE_GUIDE.md'), md, 'utf8')
console.log(`wrote CAPTURE_GUIDE.md (${log.length} entries)`)

