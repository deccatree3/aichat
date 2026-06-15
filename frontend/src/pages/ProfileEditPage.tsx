import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { profileService } from '../db/profileService'
import type { AccountData } from '../db/profileService'
import { conversationProfileService } from '../db/conversationProfileService'
import type { ConversationProfile } from '../db/conversationProfileService'

type ProfileTab = 'social' | 'chat'

function normalizeTab(value: string | null): ProfileTab {
  return value === 'chat' ? 'chat' : 'social'
}

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const tab = normalizeTab(searchParams.get('tab'))
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [conversationProfiles, setConversationProfiles] = useState<ConversationProfile[]>([])
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null)
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [conversationName, setConversationName] = useState('')
  const [conversationDescription, setConversationDescription] = useState('')
  const [conversationDefault, setConversationDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    Promise.all([
      profileService.getAccountData(user),
      conversationProfileService.list(user.id),
    ]).then(([account, conversations]) => {
      if (!mounted) return
      const selectedConversation = conversations.find((item) => item.isDefault) ?? conversations[0] ?? null
      setAccountData(account)
      setConversationProfiles(conversations)
      setNickname(account.profile.nickname ?? '')
      setUsername(account.profile.username ?? '')
      setBio(account.profile.bio ?? '')
      if (selectedConversation) setConversationForm(selectedConversation)
    })

    return () => {
      mounted = false
    }
  }, [user])

  const socialChanged = useMemo(() => {
    if (!accountData) return false
    return nickname !== accountData.profile.nickname
      || username !== accountData.profile.username
      || bio !== (accountData.profile.bio ?? '')
  }, [accountData, bio, nickname, username])

  const canSaveSocial = Boolean(user && nickname.trim() && username.trim() && socialChanged && !saving)
  const canSaveConversation = Boolean(user && conversationName.trim() && !saving)
  const selectedConversation = conversationProfiles.find((item) => item.id === editingConversationId) ?? null
  const isNewConversation = editingConversationId === null

  function changeTab(nextTab: ProfileTab) {
    setSearchParams({ tab: nextTab })
    setError('')
  }

  function setConversationForm(profile: ConversationProfile) {
    setEditingConversationId(profile.id)
    setConversationName(profile.name)
    setConversationDescription(profile.description ?? '')
    setConversationDefault(profile.isDefault)
  }

  function startNewConversation() {
    setEditingConversationId(null)
    setConversationName('')
    setConversationDescription('')
    setConversationDefault(!conversationProfiles.length)
    setError('')
  }

  function saveSocial(event: FormEvent) {
    event.preventDefault()
    if (!user || !canSaveSocial) return

    setSaving(true)
    setError('')
    void profileService
      .upsertProfile(user.id, {
        nickname,
        username: username.replace(/^@+/, ''),
        bio: bio.trim() || null,
        birthdate: accountData?.profile.birthdate,
        gender: accountData?.profile.gender,
        onboardingCompleted: accountData?.profile.onboardingCompleted ?? true,
      })
      .then(() => navigate('/my-page'))
      .catch((err: Error) => setError(err.message || '프로필 저장에 실패했습니다.'))
      .finally(() => setSaving(false))
  }

  function saveConversation(event: FormEvent) {
    event.preventDefault()
    if (!user || !canSaveConversation) return

    setSaving(true)
    setError('')
    void conversationProfileService
      .save(user.id, {
        id: editingConversationId ?? undefined,
        name: conversationName,
        description: conversationDescription,
        isDefault: conversationDefault,
      })
      .then((saved) => {
        setConversationProfiles((items) => {
          const nextItems = items.some((item) => item.id === saved.id)
            ? items.map((item) => (item.id === saved.id ? saved : conversationDefault ? { ...item, isDefault: false } : item))
            : [saved, ...items.map((item) => (conversationDefault ? { ...item, isDefault: false } : item))]
          return nextItems.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id)
        })
        setConversationForm(saved)
      })
      .catch((err: Error) => setError(err.message || '대화 프로필 저장에 실패했습니다.'))
      .finally(() => setSaving(false))
  }

  if (!user) {
    return (
      <main className="page settings-page profile-edit-page">
        <header className="settings-header">
          <button onClick={() => navigate(-1)} aria-label="뒤로">←</button>
          <h1>프로필 편집</h1>
          <span />
        </header>
        <section className="empty-state">
          <strong>로그인이 필요합니다</strong>
          <p>프로필은 로그인 후 수정할 수 있습니다.</p>
          <Link to="/login">로그인</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page settings-page profile-edit-page">
      <header className="settings-header profile-edit-header">
        <button onClick={() => navigate(-1)} aria-label="뒤로">←</button>
        <h1>프로필 편집</h1>
        <button
          className={tab === 'social' ? (canSaveSocial ? 'profile-save is-active' : 'profile-save') : (canSaveConversation ? 'profile-save is-active' : 'profile-save')}
          type="submit"
          form={tab === 'social' ? 'social-profile-form' : 'conversation-profile-form'}
          disabled={tab === 'social' ? !canSaveSocial : !canSaveConversation}
        >
          저장
        </button>
      </header>

      <div className="profile-tabs" role="tablist" aria-label="프로필 종류">
        <button className={tab === 'social' ? 'is-active' : ''} onClick={() => changeTab('social')} role="tab" aria-selected={tab === 'social'}>
          소셜 프로필
        </button>
        <button className={tab === 'chat' ? 'is-active' : ''} onClick={() => changeTab('chat')} role="tab" aria-selected={tab === 'chat'}>
          대화 프로필
        </button>
      </div>

      {tab === 'social' ? (
        <form id="social-profile-form" className="profile-edit-form" onSubmit={saveSocial}>
          <section className="profile-preview">
            <div className="avatar" aria-hidden="true">
              {accountData?.profile.avatarUrl ? <img src={accountData.profile.avatarUrl} alt="" /> : <span />}
            </div>
            <div>
              <strong>{nickname || 'aichat 회원'}</strong>
              <span>@{username || 'id'}</span>
            </div>
          </section>

          <label className="profile-edit-field">
            <strong>닉네임</strong>
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={24} />
          </label>
          <label className="profile-edit-field">
            <strong>아이디</strong>
            <input value={username} onChange={(event) => setUsername(event.target.value.replace(/^@+/, ''))} maxLength={32} />
          </label>
          <label className="profile-edit-field">
            <strong>소개</strong>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={100} placeholder="소개를 입력해주세요" />
            <small>{bio.length}/100</small>
          </label>
        </form>
      ) : (
        <form id="conversation-profile-form" className="profile-edit-form" onSubmit={saveConversation}>
          <button type="button" className="conversation-add-card" onClick={startNewConversation}>
            <span aria-hidden="true">+</span>
            <strong>대화 프로필 추가</strong>
          </button>

          {conversationProfiles.length > 0 && (
            <section className="conversation-profile-list" aria-label="대화 프로필 목록">
              {conversationProfiles.map((profile) => (
                <button
                  type="button"
                  className={profile.id === editingConversationId ? 'conversation-profile-row is-selected' : 'conversation-profile-row'}
                  key={profile.id}
                  onClick={() => setConversationForm(profile)}
                >
                  <span className="avatar" aria-hidden="true">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span />}
                  </span>
                  <strong>{profile.name}</strong>
                  {profile.isDefault && <em>기본</em>}
                  <b aria-hidden="true">✎</b>
                </button>
              ))}
            </section>
          )}

          <section className="conversation-edit-panel">
            <h2>{isNewConversation ? '대화 프로필 추가' : '대화 프로필 편집'}</h2>
            <label className="profile-edit-field">
              <strong>이름</strong>
              <small>캐릭터가 나를 이렇게 부를 거예요</small>
              <input value={conversationName} onChange={(event) => setConversationName(event.target.value)} maxLength={24} />
            </label>
            <label className="profile-edit-field">
              <strong>설명(선택)</strong>
              <textarea value={conversationDescription} onChange={(event) => setConversationDescription(event.target.value)} maxLength={160} />
            </label>
            <button type="button" className="default-profile-toggle" onClick={() => setConversationDefault((value) => !value)}>
              <span>
                <strong>기본 대화 프로필</strong>
                <small>새로운 대화 시작할 때 이 프로필 적용하기</small>
              </span>
              <i className={conversationDefault ? 'switch switch--on' : 'switch'} aria-hidden="true" />
            </button>
            {selectedConversation?.isDefault && !conversationDefault && (
              <p className="notice-state">기본 프로필을 끄면 저장 후 기본 대화 프로필이 없어질 수 있습니다.</p>
            )}
          </section>
        </form>
      )}

      {error && <p className="notice-state notice-state--error">{error}</p>}
    </main>
  )
}
