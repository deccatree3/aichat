import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { profileService } from '../db/profileService'
import type { AccountData } from '../db/profileService'
import { conversationProfileService } from '../db/conversationProfileService'
import type { ConversationProfile } from '../db/conversationProfileService'
import { avatarUploadService } from '../db/avatarUploadService'

type ProfileTab = 'social' | 'chat'
type ToastState = {
  title: string
  description?: string
  tone?: 'success' | 'info'
}

function normalizeTab(value: string | null): ProfileTab {
  return value === 'chat' ? 'chat' : 'social'
}

function normalizeUsername(value: string) {
  return value.replaceAll('@', '').trim()
}

export default function ProfileEditPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const tab = normalizeTab(searchParams.get('tab'))
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [conversationProfiles, setConversationProfiles] = useState<ConversationProfile[]>([])
  const [editingConversationId, setEditingConversationId] = useState<number | null | undefined>(undefined)
  const [nickname, setNickname] = useState('')
  const [username, setUsername] = useState('')
  const [socialAvatarUrl, setSocialAvatarUrl] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [conversationName, setConversationName] = useState('')
  const [conversationDescription, setConversationDescription] = useState('')
  const [conversationAvatarUrl, setConversationAvatarUrl] = useState<string | null>(null)
  const [conversationDefault, setConversationDefault] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState<ProfileTab | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    if (!user) return undefined

    Promise.all([
      profileService.getAccountData(user),
      conversationProfileService.list(user.id),
    ]).then(([account, conversations]) => {
      if (!mounted) return
      setAccountData(account)
      setConversationProfiles(conversations)
      setNickname(account.profile.nickname ?? '')
      setUsername(account.profile.username ?? '')
      setSocialAvatarUrl(account.profile.avatarUrl ?? null)
      setBio(account.profile.bio ?? '')
    })

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const canSaveSocial = Boolean(user && nickname.trim() && username.trim() && !saving && !uploadingAvatar)
  const isEditingConversation = editingConversationId !== undefined
  const canSaveConversation = Boolean(user && isEditingConversation && conversationName.trim() && !saving && !uploadingAvatar)
  const selectedConversation = conversationProfiles.find((item) => item.id === editingConversationId) ?? null
  const isNewConversation = editingConversationId === null
  const conversationDefaultLocked = isEditingConversation
    && ((isNewConversation && conversationProfiles.length === 0) || (!isNewConversation && conversationProfiles.length <= 1))
  const effectiveConversationDefault = conversationDefaultLocked ? true : conversationDefault
  const headerTitle = tab === 'chat' && isEditingConversation
    ? (isNewConversation ? '대화 프로필 추가' : '대화 프로필 편집')
    : '프로필 편집'
  const showConversationDelete = tab === 'chat' && typeof editingConversationId === 'number'

  function goBack() {
    if (tab === 'chat' && isEditingConversation) {
      setEditingConversationId(undefined)
      setDeleteConfirmOpen(false)
      setError('')
      return
    }
    navigate(-1)
  }

  function changeTab(nextTab: ProfileTab) {
    setSearchParams({ tab: nextTab })
    setError('')
  }

  function setConversationForm(profile: ConversationProfile) {
    setEditingConversationId(profile.id)
    setConversationName(profile.name)
    setConversationDescription(profile.description ?? '')
    setConversationAvatarUrl(profile.avatarUrl ?? null)
    setConversationDefault(conversationProfiles.length <= 1 ? true : profile.isDefault)
  }

  function startNewConversation() {
    setEditingConversationId(null)
    setConversationName('')
    setConversationDescription('')
    setConversationAvatarUrl(null)
    setConversationDefault(!conversationProfiles.length)
    setDeleteConfirmOpen(false)
    setError('')
  }

  function uploadSocialAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!user || !file) return

    setUploadingAvatar('social')
    setError('')
    void avatarUploadService.upload(user.uid, 'social', file)
      .then((url) => setSocialAvatarUrl(url))
      .catch((err: Error) => setError(err.message || '프로필 사진 업로드에 실패했습니다.'))
      .finally(() => setUploadingAvatar(null))
  }

  function uploadConversationAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!user || !file) return

    setUploadingAvatar('chat')
    setError('')
    void avatarUploadService.upload(user.uid, 'conversation', file, editingConversationId)
      .then((url) => setConversationAvatarUrl(url))
      .catch((err: Error) => setError(err.message || '프로필 사진 업로드에 실패했습니다.'))
      .finally(() => setUploadingAvatar(null))
  }

  function saveSocial(event: FormEvent) {
    event.preventDefault()
    if (!user || !canSaveSocial) return

    setSaving(true)
    setError('')
    void profileService
      .upsertProfile(user.id, {
        nickname,
        username: normalizeUsername(username),
        bio: bio.trim() || null,
        avatarUrl: socialAvatarUrl,
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

    const wasNewConversation = isNewConversation
    setSaving(true)
    setError('')
    void conversationProfileService
      .save(user.id, {
        id: typeof editingConversationId === 'number' ? editingConversationId : undefined,
        name: conversationName,
        description: conversationDescription,
        avatarUrl: conversationAvatarUrl,
        isDefault: effectiveConversationDefault,
      })
      .then((saved) => {
        setConversationProfiles((items) => {
          const nextItems = items.some((item) => item.id === saved.id)
            ? items.map((item) => (item.id === saved.id ? saved : effectiveConversationDefault ? { ...item, isDefault: false } : item))
            : [saved, ...items.map((item) => (effectiveConversationDefault ? { ...item, isDefault: false } : item))]
          return nextItems.sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id)
        })
        setConversationForm(saved)
        setEditingConversationId(undefined)
        if (wasNewConversation) setToast({ title: '대화 프로필을 추가했어요' })
      })
      .catch((err: Error) => setError(err.message || '대화 프로필 저장에 실패했습니다.'))
      .finally(() => setSaving(false))
  }

  function deleteConversationProfile() {
    if (!user || typeof editingConversationId !== 'number') return

    const deletingId = editingConversationId
    setSaving(true)
    setError('')
    void conversationProfileService
      .remove(user.id, deletingId)
      .then(() => {
        setConversationProfiles((items) => {
          const deleted = items.find((item) => item.id === deletingId)
          const remaining = items.filter((item) => item.id !== deletingId)
          if (deleted?.isDefault && remaining.length > 0 && !remaining.some((item) => item.isDefault)) {
            return remaining
              .map((item, index) => (index === 0 ? { ...item, isDefault: true } : item))
              .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id)
          }
          return remaining
        })
        setDeleteConfirmOpen(false)
        setEditingConversationId(undefined)
        setToast({ title: '대화 프로필을 삭제했어요' })
      })
      .catch((err: Error) => setError(err.message || '대화 프로필 삭제에 실패했습니다.'))
      .finally(() => setSaving(false))
  }

  function requestDeleteConversationProfile() {
    if (selectedConversation?.isDefault) {
      setToast({
        title: '기본 대화 프로필은 삭제할 수 없어요',
        description: '다른 프로필을 기본 대화 프로필로 변경하고 시도해주세요',
        tone: 'info',
      })
      return
    }
    setDeleteConfirmOpen(true)
  }

  if (!user) {
    return (
      <main className="page settings-page profile-edit-page">
        <header className="settings-header">
          <button onClick={goBack} aria-label="뒤로">←</button>
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
      {toast && (
        <div className={toast.tone === 'info' ? 'profile-toast profile-toast--info' : 'profile-toast'} role="status">
          <span aria-hidden="true">{toast.tone === 'info' ? 'ⓘ' : '✓'}</span>
          <span>
            <strong>{toast.title}</strong>
            {toast.description && <small>{toast.description}</small>}
          </span>
        </div>
      )}
      <header className="settings-header profile-edit-header">
        <button onClick={goBack} aria-label="뒤로">←</button>
        <h1>{headerTitle}</h1>
        {showConversationDelete ? (
          <button
            type="button"
            className="profile-delete-button"
            onClick={requestDeleteConversationProfile}
            aria-label="대화 프로필 삭제"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Z" />
              <path d="M6 9h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
            </svg>
          </button>
        ) : tab === 'social' ? (
          <button
            className={canSaveSocial ? 'profile-save is-active' : 'profile-save'}
            type="submit"
            form="social-profile-form"
            disabled={!canSaveSocial}
          >
            저장
          </button>
        ) : (
          <span />
        )}
      </header>

      {!(tab === 'chat' && isEditingConversation) && (
        <div className="profile-tabs" role="tablist" aria-label="프로필 종류">
          <button className={tab === 'social' ? 'is-active' : ''} onClick={() => changeTab('social')} role="tab" aria-selected={tab === 'social'}>
            소셜 프로필
          </button>
          <button className={tab === 'chat' ? 'is-active' : ''} onClick={() => changeTab('chat')} role="tab" aria-selected={tab === 'chat'}>
            대화 프로필
          </button>
        </div>
      )}

      {tab === 'social' ? (
        <form id="social-profile-form" className="profile-edit-form" onSubmit={saveSocial}>
          <section className="profile-preview">
            <label className="avatar avatar-editor" aria-label="소셜 프로필 사진 변경">
              {socialAvatarUrl ? <img src={socialAvatarUrl} alt="" /> : <span />}
              <input type="file" accept="image/*" onChange={uploadSocialAvatar} disabled={uploadingAvatar !== null} />
              <b aria-hidden="true">{uploadingAvatar === 'social' ? '...' : '✎'}</b>
            </label>
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
            <span className="username-input">
              <b aria-hidden="true">@</b>
              <input value={username} onChange={(event) => setUsername(normalizeUsername(event.target.value))} maxLength={32} />
            </span>
          </label>
          <label className="profile-edit-field">
            <strong>소개</strong>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={100} placeholder="소개를 입력해주세요" />
            <small>{bio.length}/100</small>
          </label>
        </form>
      ) : (
        <form id="conversation-profile-form" className="profile-edit-form" onSubmit={saveConversation}>
          {!isEditingConversation && (
            <button type="button" className="conversation-add-card" onClick={startNewConversation}>
              <span aria-hidden="true">+</span>
              <strong>대화 프로필 추가</strong>
            </button>
          )}

          {!isEditingConversation && conversationProfiles.length > 0 && (
            <section className="conversation-profile-list" aria-label="대화 프로필 목록">
              {conversationProfiles.map((profile) => (
                <div
                  className={profile.id === editingConversationId ? 'conversation-profile-row is-selected' : 'conversation-profile-row'}
                  key={profile.id}
                >
                  <span className="avatar" aria-hidden="true">
                    {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span />}
                  </span>
                  <strong>{profile.name}</strong>
                  {profile.isDefault && <em>기본</em>}
                  <button type="button" className="conversation-profile-edit" onClick={() => setConversationForm(profile)} aria-label={`${profile.name} 편집`}>
                    ✎
                  </button>
                </div>
              ))}
            </section>
          )}

          {isEditingConversation && (
            <section className="conversation-edit-panel">
              <h2>{isNewConversation ? '대화 프로필 추가' : '대화 프로필 편집'}</h2>
              <label className="conversation-avatar-editor" aria-label="대화 프로필 사진 변경">
                <span className="avatar avatar-editor">
                  {conversationAvatarUrl ? <img src={conversationAvatarUrl} alt="" /> : <span />}
                  <b aria-hidden="true">{uploadingAvatar === 'chat' ? '...' : '✎'}</b>
                </span>
                <input type="file" accept="image/*" onChange={uploadConversationAvatar} disabled={uploadingAvatar !== null} />
              </label>
              <label className="profile-edit-field">
                <strong>이름</strong>
                <small>캐릭터가 나를 이렇게 부를 거예요</small>
                <input value={conversationName} onChange={(event) => setConversationName(event.target.value)} maxLength={24} />
              </label>
              <label className="profile-edit-field">
                <strong>설명(선택)</strong>
                <textarea value={conversationDescription} onChange={(event) => setConversationDescription(event.target.value)} maxLength={160} />
              </label>
              <button
                type="button"
                className={conversationDefaultLocked ? 'default-profile-toggle default-profile-toggle--locked' : 'default-profile-toggle'}
                onClick={() => {
                  if (!conversationDefaultLocked) setConversationDefault((value) => !value)
                }}
                aria-disabled={conversationDefaultLocked}
              >
                <span>
                  <strong>기본 대화 프로필</strong>
                  <small>새로운 대화 시작할 때 이 프로필 적용하기</small>
                </span>
                <i className={effectiveConversationDefault ? 'switch switch--on' : 'switch'} aria-hidden="true" />
              </button>
              {selectedConversation?.isDefault && !effectiveConversationDefault && (
                <p className="notice-state">기본 프로필을 끄면 저장 후 기본 대화 프로필이 없어질 수 있습니다.</p>
              )}
              <div className="profile-bottom-actions">
                <button className={canSaveConversation ? 'profile-bottom-save is-active' : 'profile-bottom-save'} type="submit" disabled={!canSaveConversation}>
                  저장하기
                </button>
              </div>
            </section>
          )}
        </form>
      )}

      {deleteConfirmOpen && (
        <div className="profile-delete-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-delete-title">
          <section className="profile-delete-confirm">
            <h2 id="profile-delete-title">정말 삭제하실 건가요?</h2>
            <p>
              삭제한 프로필은 되돌릴 수 없어요.
              <br />
              사용 중인 대화방에는 기본 대화 프로필이 적용될 거예요.
            </p>
            <div>
              <button type="button" onClick={() => setDeleteConfirmOpen(false)} disabled={saving}>취소</button>
              <button type="button" onClick={deleteConversationProfile} disabled={saving}>삭제</button>
            </div>
          </section>
        </div>
      )}

      {error && <p className="notice-state notice-state--error">{error}</p>}
    </main>
  )
}
