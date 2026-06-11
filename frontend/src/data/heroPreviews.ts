export interface HeroMessage {
  type: 'narration' | 'dialogue'
  text: string
}

export interface HeroPreview {
  name: string
  messages: HeroMessage[]
}

export const heroPreviews: HeroPreview[] = [
  {
    name: '성현진',
    messages: [
      { type: 'narration', text: '예쁜 여사친의 시선이 부담스럽다' },
      { type: 'dialogue', text: '아까부터 왜 쳐다보는데?' },
      { type: 'dialogue', text: '너 잘생겨서 친해지고 싶어!' },
      { type: 'dialogue', text: '하 꺼져, 맘에 없는 말 지껄이지 말고' },
    ],
  },
  {
    name: '일진녀 수현',
    messages: [
      { type: 'dialogue', text: '친구야 내가 돈이 없어서 그러는데 혹시 3만원만 빌려 줄 수 있어?' },
      { type: 'narration', text: '손에 든 봉투를 등 뒤에 감춘다' },
      { type: 'dialogue', text: '이거 내 교재빈데..ㅠ' },
    ],
  },
  {
    name: '가출소녀 지원',
    messages: [
      { type: 'dialogue', text: '윽... 오늘따라 유독 배고프다...' },
      { type: 'narration', text: '미슐랭 3성급 오마카세 집에 데려간다' },
      { type: 'dialogue', text: '와 이게 뭐에요?! 미쳤어...' },
    ],
  },
]

