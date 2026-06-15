import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { profileService } from '../db/profileService'
import { conversationProfileService } from '../db/conversationProfileService'

type SignupStep = 'name' | 'details'
type Gender = 'female' | 'male' | ''

function onlyDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

function isValidDate(year: string, month: string, day: string) {
  if (year.length !== 4 || month.length < 1 || day.length < 1) return false
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (y < 1900 || y > new Date().getFullYear()) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export default function SignupProfilePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState<SignupStep>('name')
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [gender, setGender] = useState<Gender>('')
  const canContinue = Boolean(name.trim())
  const hasDateInput = Boolean(year || month || day)
  const dateValid = useMemo(() => isValidDate(year, month, day), [year, month, day])
  const canComplete = dateValid && Boolean(gender)

  const goBack = () => {
    if (step === 'details') setStep('name')
    else navigate(-1)
  }

  const completeSignup = () => {
    if (user) {
      const birthdate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      void Promise.all([
        profileService.ensureSocialProfile(user, {
          birthdate,
          gender,
          onboardingCompleted: true,
        }),
        conversationProfileService.ensureDefault(user.id, name),
      ])
    }
    navigate('/my-page')
  }

  return (
    <main className="page signup-page">
      <header className="settings-header">
        <button onClick={goBack} aria-label="뒤로">‹</button>
        <h1>회원가입</h1>
        <span />
      </header>

      {step === 'name' ? (
        <>
          <section className="signup-profile">
            <h2>aichat에서는 무엇이든 될 수 있어요 🧚</h2>
            <p>대화할 때 사용할 프로필을 만들어보세요<br />나중에도 수정할 수 있어요</p>

            <label>
              <strong>이름</strong>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="캐릭터가 날 이렇게 부를 거예요" />
            </label>
          </section>

          <button className={canContinue ? 'signup-next signup-next--active' : 'signup-next'} disabled={!canContinue} onClick={() => setStep('details')}>다음</button>
        </>
      ) : (
        <>
          <section className="signup-profile signup-details">
            <h2>두 가지만 알려주시면<br />재미있는 플롯을 추천해드릴게요 😊</h2>
            <p>이 정보는 대화에 반영되지 않아요<br />다른 사람들은 볼 수 없으니 안심하세요</p>

            <div className="signup-field">
              <strong>생년월일</strong>
              <div className="birth-inputs">
                <input inputMode="numeric" value={year} onChange={(event) => setYear(onlyDigits(event.target.value, 4))} placeholder="YYYY" aria-label="출생 연도" />
                <input inputMode="numeric" value={month} onChange={(event) => setMonth(onlyDigits(event.target.value, 2))} placeholder="월" aria-label="출생 월" />
                <input inputMode="numeric" value={day} onChange={(event) => setDay(onlyDigits(event.target.value, 2))} placeholder="일" aria-label="출생 일" />
              </div>
              {hasDateInput && !dateValid && <p className="signup-error">ⓘ 날짜 형식이 올바르지 않습니다.</p>}
            </div>

            <div className="signup-field">
              <strong>성별</strong>
              <div className="gender-options">
                <button className={gender === 'female' ? 'gender-option gender-option--active' : 'gender-option'} onClick={() => setGender('female')}>
                  <span>여성</span>
                  <b aria-hidden="true">✓</b>
                </button>
                <button className={gender === 'male' ? 'gender-option gender-option--active' : 'gender-option'} onClick={() => setGender('male')}>
                  <span>남성</span>
                  <b aria-hidden="true">✓</b>
                </button>
              </div>
            </div>
          </section>

          <button className={canComplete ? 'signup-next signup-next--active' : 'signup-next'} disabled={!canComplete} onClick={completeSignup}>가입완료</button>
        </>
      )}
    </main>
  )
}
