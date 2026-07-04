import { useEffect, useState } from 'react'
import { fetchBalances, LeaveBalance } from '../api/leave'

// 有給GASの残日数を姓キーでキャッシュ。タブ切替の度に取り直さない。
type BalanceMap = Record<string, LeaveBalance>

let cache: BalanceMap | null = null
let cacheTime = 0
let inflight: Promise<BalanceMap> | null = null
const TTL = 60_000 // 60秒以内は再取得しない

function toMap(list: LeaveBalance[]): BalanceMap {
  const map: BalanceMap = {}
  list.forEach(b => { if (b.surname) map[b.surname] = b })
  return map
}

function load(force = false): Promise<BalanceMap> {
  const fresh = cache && Date.now() - cacheTime < TTL
  if (fresh && !force) return Promise.resolve(cache as BalanceMap)
  if (inflight) return inflight
  inflight = fetchBalances()
    .then(list => {
      cache = toMap(list)
      cacheTime = Date.now()
      return cache
    })
    .catch(() => cache || {})
    .finally(() => { inflight = null }) as Promise<BalanceMap>
  return inflight
}

/** アプリ起動時などに先読みしてキャッシュを温める */
export function prefetchLeaveBalances() {
  load(false)
}

/** 強制再取得（申請直後などに最新化したい場合） */
export function refreshLeaveBalances() {
  return load(true)
}

/**
 * 残日数マップを返す。キャッシュがあれば即時表示し、必要なら裏で最新化。
 */
export function useLeaveBalances() {
  const [balances, setBalances] = useState<BalanceMap>(cache || {})
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    let alive = true
    if (cache) setBalances(cache) // まず前回値を即表示（チラつき防止）
    load(false).then(map => {
      if (!alive) return
      setBalances(map)
      setLoading(false)
    })
    return () => { alive = false }
  }, [])

  return { balances, loading }
}
