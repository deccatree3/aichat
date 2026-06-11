import type { ReactNode } from 'react'

interface Props {
  variant?: 'dark' | 'light'
  icon: ReactNode
  label: string
  onClick: () => void
}

export default function SocialButton({ variant = 'dark', icon, label, onClick }: Props) {
  return (
    <button className={`social-btn social-btn--${variant}`} onClick={onClick}>
      <span className="social-btn__icon">{icon}</span>
      <span className="social-btn__label">{label}</span>
    </button>
  )
}

