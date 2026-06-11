import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', icon: '⌂', label: '홈' },
  { to: '/rooms', icon: '●', label: '대화' },
  { to: '/create', icon: '+', label: '제작' },
  { to: '/my-page', icon: '♟', label: '마이페이지' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className="bottom-nav__item">
          <span aria-hidden="true">{item.icon}</span>
          <b>{item.label}</b>
        </NavLink>
      ))}
    </nav>
  )
}
