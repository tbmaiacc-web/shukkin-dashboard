import { addMonths, addYears, differenceInMonths, isBefore, format } from 'date-fns'
import { ja } from 'date-fns/locale'

// 労働基準法の有給付与テーブル（勤続月数 → 付与日数）
const PAID_LEAVE_TABLE = [
  { months: 6,  days: 10 },
  { months: 18, days: 11 },
  { months: 30, days: 12 },
  { months: 42, days: 14 },
  { months: 54, days: 16 },
  { months: 66, days: 18 },
  { months: 78, days: 20 }, // 6.5年以降は毎年20日
]

export interface LeaveGrantInfo {
  nextGrantDate: Date
  nextGrantDays: number
  serviceMonths: number
  serviceYears: number
  serviceMonthsRemainder: number
  lastGrantDate: Date | null
  lastGrantDays: number | null
}

export function getPaidLeaveGrantInfo(hireDate: string): LeaveGrantInfo | null {
  if (!hireDate) return null
  try {
    const hire = new Date(hireDate)
    if (isNaN(hire.getTime())) return null
    const today = new Date()
    const serviceMonths = differenceInMonths(today, hire)

    // 次回付与日・付与日数を計算
    for (let i = 0; i < PAID_LEAVE_TABLE.length; i++) {
      const { months, days } = PAID_LEAVE_TABLE[i]
      const grantDate = addMonths(hire, months)
      if (isBefore(today, grantDate)) {
        // まだこの付与日を迎えていない
        const prev = i > 0 ? PAID_LEAVE_TABLE[i - 1] : null
        return {
          nextGrantDate: grantDate,
          nextGrantDays: days,
          serviceMonths,
          serviceYears: Math.floor(serviceMonths / 12),
          serviceMonthsRemainder: serviceMonths % 12,
          lastGrantDate: prev ? addMonths(hire, prev.months) : null,
          lastGrantDays: prev ? prev.days : null,
        }
      }
    }

    // 6.5年以降: 毎年20日
    const base = addMonths(hire, 78)
    let nextDate = base
    while (!isBefore(today, nextDate)) {
      nextDate = addYears(nextDate, 1)
    }
    const prevDate = addYears(nextDate, -1)
    return {
      nextGrantDate: nextDate,
      nextGrantDays: 20,
      serviceMonths,
      serviceYears: Math.floor(serviceMonths / 12),
      serviceMonthsRemainder: serviceMonths % 12,
      lastGrantDate: prevDate,
      lastGrantDays: 20,
    }
  } catch {
    return null
  }
}

export function formatGrantDate(date: Date): string {
  return format(date, 'yyyy年M月d日 (E)', { locale: ja })
}

export function formatShortDate(date: Date): string {
  return format(date, 'yyyy/M/d')
}
