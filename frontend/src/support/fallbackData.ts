import type { Contact, ContactDetail, Faq, SupportCategory } from './types'

export const fallbackCategories: SupportCategory[] = [
  { id: 'account', name: '계정 및 인증', description: '로그인, 프로필, 본인 인증', sortOrder: 1 },
  { id: 'payment', name: '결제 · 구독 · 환불', description: '피스, 구독, 환불', sortOrder: 2 },
  { id: 'chat', name: '플롯 제작', description: '플롯과 캐릭터 제작', sortOrder: 3 },
  { id: 'ai', name: 'AI 대화', description: '응답 품질과 모델 설정', sortOrder: 4 },
  { id: 'safety', name: '문제 해결', description: '차단, 오류, 정책 조치', sortOrder: 5 },
  { id: 'feedback', name: '제안 및 제보', description: '기능 제안, 권리 침해 제보', sortOrder: 6 },
]

export const fallbackFaqs: Faq[] = [
  {
    id: 'faq-piece-price',
    categoryId: 'payment',
    categoryName: '결제 및 환불',
    title: '왜 피스 충전시 웹/앱 가격에 차이가 있나요?',
    bodyMarkdown: '결제 수단, 스토어 수수료, 프로모션 적용 여부에 따라 표시 금액과 최종 결제 금액이 다를 수 있습니다.\n\n결제 내역이 이상하다면 1:1 문의로 영수증 정보를 보내주세요.',
    isPopular: true,
    sortOrder: 1,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'faq-pass-cancel',
    categoryId: 'payment',
    categoryName: '결제 및 환불',
    title: 'aichat 패스를 환불받고 싶어요.',
    bodyMarkdown: '마이페이지의 결제 관리에서 구독 상태를 확인하고 해지할 수 있습니다.\n\n스토어를 통해 결제한 경우 각 스토어의 구독 관리 화면에서 해지해야 합니다.',
    isPopular: true,
    sortOrder: 2,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'faq-piece-refund',
    categoryId: 'payment',
    categoryName: '결제 및 환불',
    title: '피스를 환불하고 싶어요.',
    bodyMarkdown: '사용하지 않은 유료 피스는 정책에 따라 환불 검토가 가능합니다.\n\n구매 일시, 결제 수단, 주문 번호를 포함해 문의해주세요.',
    isPopular: true,
    sortOrder: 3,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'faq-blocked-content',
    categoryId: 'safety',
    categoryName: '신고 및 차단',
    title: '정책 위반으로 플롯/이미지가 삭제되고 제작 차단 조치가 적용되었어요.',
    bodyMarkdown: '권리 침해가 의심되는 화면을 캡처하고, 관련 URL과 권리자 정보를 함께 보내주세요.\n\n접수된 신고는 정책에 따라 검토 후 조치합니다.',
    isPopular: true,
    sortOrder: 4,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'faq-ai-quality',
    categoryId: 'ai',
    categoryName: 'AI 답변',
    title: 'aichat에 개선 의견을 제안하고 싶어요.',
    bodyMarkdown: '대화 설정을 조정하거나 새 대화를 시작해보세요.\n\n반복적으로 문제가 발생하면 예시 대화와 함께 문의를 남겨주세요.',
    isPopular: true,
    sortOrder: 5,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'faq-login',
    categoryId: 'account',
    categoryName: '계정 및 인증',
    title: '로그인이 되지 않아요.',
    bodyMarkdown: '네트워크 상태를 확인한 뒤 다시 시도해주세요.\n\n소셜 로그인 계정을 변경한 경우 기존 계정과 다른 사용자로 인식될 수 있습니다.',
    isPopular: false,
    sortOrder: 6,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
]

export function fallbackContacts(userId: string): Contact[] {
  return [
    {
      id: 'contact-sample',
      userId,
      categoryId: 'feedback',
      categoryName: '제안 및 오류',
      title: '샘플 문의입니다',
      body: 'Supabase 연결 전에는 샘플 문의가 표시됩니다.',
      status: 'answered',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    },
  ]
}

export function fallbackContactDetail(userId: string, id: string): ContactDetail | null {
  const contact = fallbackContacts(userId).find((item) => item.id === id)
  if (!contact) return null
  return {
    contact,
    replies: [
      {
        id: 'reply-sample',
        contactId: contact.id,
        authorId: null,
        body: '문의가 접수되면 이곳에서 답변을 확인할 수 있습니다.',
        isStaff: true,
        createdAt: '2026-06-01T01:00:00.000Z',
      },
    ],
  }
}
