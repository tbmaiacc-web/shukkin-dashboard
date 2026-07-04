// GAS Web AppをデプロイしたらここにURLを貼ってください
// 例: https://script.google.com/macros/s/AKfycb.../exec
export const GAS_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbx8wCSyxSiL8nSfEV6hKzif1_B4QlUlHx6c27xxBWle8pmM2hxD-UoeB5hzXXfUgBIOuA/exec'

// 有給申請システム（別GAS）の Web App URL。残日数の「正」はこちら。
// 有給申請UIはこのエンドポイントを叩く（記録→残再計算→唐澤通知はGAS側で実行）
export const LEAVE_GAS_URL = import.meta.env.VITE_LEAVE_GAS_URL || 'https://script.google.com/macros/s/AKfycbwpmy38Y04aLcNRLJ78Zy6EmUKisHvHi3u7yQCRjdwjx0vRxelDG-pdAUBEDtXJDwn9rQ/exec'
