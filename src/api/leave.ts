import { LEAVE_GAS_URL } from '../config'

// 有給申請システム(別GAS)との通信。CORS回避のため GET(クエリ) で叩く（既存 gasGet と同流儀）。

async function leaveGet(params: Record<string, string>): Promise<any> {
  const url = new URL(LEAVE_GAS_URL)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const r = await fetch(url.toString())
  return r.json().catch(() => ({ ok: false, error: 'invalid response' }))
}

export interface StaffOptions {
  names: string[]
  depts: string[]
  kinds: string[]
}

export type LeaveType = '有給' | 'アニバーサリー'

export interface PaidBalance {
  granted: number
  taken: number
  adjust: number
  remaining: number
}
export interface AnnivBalance {
  allot: number
  adjust: number
  taken: number
  remaining: number
}

// balances/balance 共通。submit時はフラット（remaining等が直下）、一覧時は paid/anniv 構造
export interface LeaveBalance {
  name: string
  surname?: string
  dept?: string
  remaining: number | null
  note?: string
  leaveType?: LeaveType
  // submit戻り（フラット）
  granted?: number
  taken?: number
  adjust?: number
  allot?: number
  // 一覧戻り（構造）
  paid?: PaidBalance | null
  anniv?: AnnivBalance
  verified?: boolean // false = 入社日/有給/アニ調整が未完（一覧でアラート）
}

export async function fetchStaffOptions(): Promise<StaffOptions> {
  const data = await leaveGet({ action: 'staff' })
  return data.staff || { names: [], depts: [], kinds: ['全日', '午前半休', '午後半休'] }
}

export async function fetchBalances(): Promise<LeaveBalance[]> {
  const data = await leaveGet({ action: 'balances' })
  return data.balances || []
}

export interface SubmitLeaveInput {
  name: string
  dept: string
  startDate: string // 'yyyy-MM-dd'
  kind: string
  days: number
  reason?: string
  leaveType?: LeaveType
}

export interface SubmitLeaveResult {
  ok: boolean
  error?: string
  leaveType?: LeaveType
  balance?: LeaveBalance | null
}

export async function submitLeaveRequest(input: SubmitLeaveInput): Promise<SubmitLeaveResult> {
  const data = await leaveGet({
    action: 'submitLeave',
    name: input.name,
    dept: input.dept,
    startDate: input.startDate,
    kind: input.kind,
    days: String(input.days),
    reason: input.reason || '',
    leaveType: input.leaveType || '有給',
  })
  return data
}

export interface CancelLeaveInput {
  name: string
  startDate: string   // yyyy-MM-dd
  leaveType: LeaveType
}

export async function cancelLeaveRequest(input: CancelLeaveInput): Promise<SubmitLeaveResult> {
  const data = await leaveGet({
    action: 'cancelLeave',
    name: input.name,
    startDate: input.startDate,
    leaveType: input.leaveType,
  })
  return data
}
