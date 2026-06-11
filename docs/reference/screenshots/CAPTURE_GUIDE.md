# Zeta-AI UI/UX 벤치마킹 캡처 가이드

> 어떤 URL과 상황에서 캡처했는지 정리한 참조 문서입니다.

- 캡처 방식: headed Chrome 창 단위 캡처, Win32 PrintWindow
- 레이아웃: 모바일 우선, PC에서도 중앙 정렬 모바일 컬럼
- 로그인: 카카오 / Google / Apple OAuth

## 비로그인/게스트 화면 (16종)

| # | 스크린샷 | URL | 상황 |
|---|---|---|---|
| 01 | [`zeta_01-home-guest-entry-notice-modal.png`](./zeta_01-home-guest-entry-notice-modal.png) | `https://zeta-ai.io/ko` | 첫 진입 시 자동으로 뜨는 게스트 안내/확인 모달. 홈 피드 위에 바텀시트로 '제타를 즐기기 전에 확인할 내용이 있어요' 노출, [확인하기] 버튼. |
| 02 | [`zeta_02-home-main-feed.png`](./zeta_02-home-main-feed.png) | `https://zeta-ai.io/ko` | 안내 모달 닫은 뒤 메인 홈. 추천 플롯(캐릭터) 카드 2열 피드. 상단 홈/랭킹 탭, 우상단 검색·알림 아이콘, 하단 탭바(홈/대화/제작/마이페이지). |
| 03 | [`zeta_03-home-ranking-tab.png`](./zeta_03-home-ranking-tab.png) | `https://zeta-ai.io/ko?tab=ranking` | 홈 상단 '랭킹' 탭 선택. 인기 플롯 순위 목록. |
| 04 | [`zeta_04-search-empty.png`](./zeta_04-search-empty.png) | `https://zeta-ai.io/ko/search` | 검색 화면 진입(빈 상태). 검색 입력창 + 추천 키워드/해시태그. |
| 05 | [`zeta_05-search-results.png`](./zeta_05-search-results.png) | `https://zeta-ai.io/ko/search?keyword=로맨스` | 검색창에 '로맨스' 입력 후 결과. 매칭 플롯 카드 그리드. |
| 06 | [`zeta_06-notification-guest.png`](./zeta_06-notification-guest.png) | `https://zeta-ai.io/ko/notification` | 알림 화면, 비로그인(게스트) 상태에서의 표시. |
| 07 | [`zeta_07-plot-profile-detail.png`](./zeta_07-plot-profile-detail.png) | `https://zeta-ai.io/ko/plots/b74b5b3a-d11d-43fb-a160-4a67d4ec91e5/profile` | 플롯(캐릭터) 상세/프로필. 대표 이미지, 소개, 해시태그, 하단 '대화 시작' 버튼. |
| 08 | [`zeta_08-chat-room-guest-preview.png`](./zeta_08-chat-room-guest-preview.png) | `https://zeta-ai.io/ko/rooms/{roomId}` | 플롯 상세에서 '대화 시작' 클릭 → 게스트도 대화방 미리보기 진입(스토리 인트로 + 지문/대사 말풍선, 하단 '대화 입력하기' 입력창). 실제 메시지 전송 시 로그인 모달이 뜸. |
| 09 | [`zeta_09-login-page-full.png`](./zeta_09-login-page-full.png) | `https://zeta-ai.io/ko/login` | 로그인 전체 페이지(/ko/login). 상단 히어로(대화 미리보기) + 하단 소셜 로그인 버튼: 카카오 / Google / Apple. zeta는 로그인 진입=방식선택이 한 화면(별도 모달 없음). |
| 10 | [`zeta_10-mypage-guest.png`](./zeta_10-mypage-guest.png) | `https://zeta-ai.io/ko/my-page` | 마이페이지(비로그인 상태에서도 접근/렌더됨, 리디렉션 아님). 제타패스 구독 배너, 내 피스(0)/내역/충전, 자동충전, 회사정보·약관 푸터, 우상단 ☰(→/ko/more). |
| 11 | [`zeta_11-more-settings-menu.png`](./zeta_11-more-settings-menu.png) | `https://zeta-ai.io/ko/more` | 더보기/설정 메뉴(/ko/more). 공지사항·고객센터·알림설정·계정설정·차단(크리에이터/플롯/해시태그)·제타페이·로그아웃 항목. |
| 12 | [`zeta_12-login-required-bottomsheet-modal.png`](./zeta_12-login-required-bottomsheet-modal.png) | `https://zeta-ai.io/ko?nudge=DEFAULT&redirect={pathname:settings/account}` | [핵심] 로그인 필요한 메뉴(예: 계정설정) 접근 시 홈으로 리디렉션되며 뜨는 로그인 유도 바텀시트 모달. '로그인하고 다양한 AI 플롯을 자유롭게 즐겨보세요' + 카카오/Google/Apple. 주소창의 redirect 파라미터로 원래 목적지 보존. |
| 13 | [`zeta_13-piece-charge.png`](./zeta_13-piece-charge.png) | `https://zeta-ai.io/ko/piece/charge` | 피스 충전(/ko/piece/charge). 퀵계좌이체 할인 배너 + 충전 상품 목록(200/500/1,000/2,000/3,000/5,000/10,000 피스, 원화 가격), 하단 이용안내. |
| 14 | [`zeta_14-piece-history.png`](./zeta_14-piece-history.png) | `https://zeta-ai.io/ko/piece/history` | 피스 사용/충전 내역(/ko/piece/history). |
| 15 | [`zeta_15-announcements-list.png`](./zeta_15-announcements-list.png) | `https://zeta-ai.io/ko/announcements` | 공지사항 목록(/ko/announcements). |
| 16 | [`zeta_16-support-center.png`](./zeta_16-support-center.png) | `https://support.zeta-ai.io/zeta/ko` | 고객센터. /ko/support 클릭 시 별도 지원 서브도메인(support.zeta-ai.io)으로 이동. |

## 사용 방법

```powershell
npm run capture:guest
npm run capture:auth
npm run capture:doc
```
