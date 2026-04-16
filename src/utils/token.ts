const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const USER_EMAIL_KEY = 'user_email'

export const token = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getUserEmail: () => localStorage.getItem(USER_EMAIL_KEY),
  set: (access: string, refresh: string, email?: string) => {
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    if (email) localStorage.setItem(USER_EMAIL_KEY, email)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_EMAIL_KEY)
  },
}
