export type Provider = 'kakao' | 'google' | 'apple'

export interface User {
  id: string
  mid: number
  uid: string
  nickname: string
  username: string
  email?: string
  bio?: string
  birthdate?: string
  gender?: string
  provider: Provider
  pieces: number
  followers: number
  following: number
}
