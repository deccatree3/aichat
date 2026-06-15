import { supabase } from '../auth/supabase'

const BUCKET = 'profile-avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024

export type AvatarScope = 'social' | 'conversation'

function extensionFromFile(file: File) {
  const nameExtension = file.name.split('.').pop()?.toLowerCase()
  if (nameExtension && /^[a-z0-9]+$/.test(nameExtension)) return nameExtension
  return file.type.split('/').pop() || 'jpg'
}

export const avatarUploadService = {
  async upload(uid: string, scope: AvatarScope, file: File, profileId?: number | null): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드할 수 있습니다.')
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('프로필 사진은 5MB 이하만 업로드할 수 있습니다.')
    }

    if (!supabase) {
      return URL.createObjectURL(file)
    }

    const extension = extensionFromFile(file)
    const safeProfileId = profileId ?? 'new'
    const path = `${uid}/${scope}-${safeProfileId}-${Date.now()}.${extension}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (error) throw error

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data.publicUrl
  },
}
