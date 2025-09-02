import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Category, TimeLog } from '../types'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

type Range = 'day' | 'week' | 'month'

export function Analytics() {
  const [range, setRange] = useState<Range>('day')
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<TimeLog[]>([])

  useEffect(() => {
    void refresh()
  }, [range])

  async function refresh() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
    setCategories(cats ?? [])

    const since = new Date()
    if (range === 'day') since.setDate(since.getDate() - 1)
    if (range === 'week') since.setDate(since.getDate() - 7)
    if (range === 'month') since.setMonth(since.getMonth() - 1)

    const { data: _logs } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('started_at', since.toISOString())
      .not('duration_seconds', 'is', null)
    setLogs(_logs ?? [])
  }

  const chartData = useMemo(() => {
    const nameById = new Map(categories.map((c) => [c.id, c.name]))
    const totals = new Map<string, number>()
    for (const l of logs) {
      const prev = totals.get(l.category_id) ?? 0
      totals.set(l.category_id, prev + (l.duration_seconds ?? 0))
    }
    return Array.from(totals.entries()).map(([categoryId, seconds]) => ({
      name: nameById.get(categoryId) ?? 'Unknown',
      hours: Number((seconds / 3600).toFixed(2)),
    }))
  }, [categories, logs])

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Range:</span>
        <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="border rounded px-2 py-1">
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Bar dataKey="hours" fill="#111827" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


