import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { requireAuth } from '@/lib/rbac/serverGuard'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const session = auth.session
  const userId = session.sub

  try {
    await connectDB()

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const [sittings, media, extraCopies] = await Promise.all([
      Sitting.find({ editor: userId }).lean(),
      Media.find({ editor: userId }).lean(),
      ExtraCopy.find({ editor: userId }).lean(),
    ])

    const allItems = [...sittings, ...media, ...extraCopies] as any[]

    const getStatus = (item: any) => {
      const statusValue = item.editorStatus || item.status || 'pending'
      return statusValue.toLowerCase().trim().replace(/[\s_]+/g, '-')
    }
    const getEditorStatus = (item: any) => {
      const statusValue = item.editorStatus || ''
      return statusValue.toLowerCase().trim().replace(/[\s_]+/g, '-')
    }
    const isDueToday = (requestedDate: any) => {
      if (!requestedDate) return false
      const rawDate = String(requestedDate)
      
      const tzOffset = todayStart.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
      
      return rawDate.slice(0, 10) === localISOTime;
    }

    const dueTodayItems = allItems.filter(item => isDueToday(item.requestedDate))

    let pendingJobs = dueTodayItems.filter(item => getEditorStatus(item) === 'pending').length
    let inProgressJobs = dueTodayItems.filter(item => getEditorStatus(item) === 'in-progress').length
    let completedTodayJobs = dueTodayItems.filter(item => getEditorStatus(item) === 'completed').length
    let urgentJobs = dueTodayItems.filter(item => (item.priority || '').toLowerCase() === 'urgent').length

    // Group items by orderId to count "Jobs" for work progress
    const ordersMap = new Map<string, any[]>()
    allItems.forEach(item => {
      if (!ordersMap.has(item.orderId)) {
        ordersMap.set(item.orderId, [])
      }
      ordersMap.get(item.orderId)!.push(item)
    })

    // Also calculate work progress breakdown for the chart
    // We can count items or jobs. The chart probably expects jobs.
    // Based on the mock data in editor/page.tsx:
    // { name: "Completed", value: 12, color: "#10b981" },
    // { name: "In Progress", value: 5, color: "#8b5cf6" },
    // { name: "Pending", value: 8, color: "#f59e0b" },
    // { name: "Overdue", value: 2, color: "#ef4444" },
    
    // Let's count totals for the chart:
    let totalCompleted = 0
    let totalInProgress = 0
    let totalPending = 0
    let totalOverdue = 0 
    const now = new Date()

    ordersMap.forEach((items) => {
        const allCompleted = items.every(i => getStatus(i) === 'completed')
        const hasInProgress = items.some(i => getStatus(i) === 'in-progress')
        const hasPending = items.some(i => getStatus(i) === 'pending')
        
        // Check for overdue (deadline passed and not completed)
        // We'll use the earliest requestedDate of uncompleted items
        let isOverdue = false
        if (!allCompleted) {
            const uncompletedItems = items.filter(i => getStatus(i) !== 'completed' && getStatus(i) !== 'cancelled')
            for (const item of uncompletedItems) {
                if (item.requestedDate) {
                    const dueDate = new Date(item.requestedDate)
                    // If dueDate is valid and before today
                    if (!isNaN(dueDate.getTime()) && dueDate < todayStart) {
                        isOverdue = true
                        break
                    }
                }
            }
        }

        if (isOverdue) {
            totalOverdue++
        } else if (allCompleted) {
            totalCompleted++
        } else if (hasInProgress) {
            totalInProgress++
        } else {
            totalPending++
        }
    })


    return NextResponse.json({
      pendingJobs,
      inProgressJobs,
      completedTodayJobs,
      urgentJobs,
      workProgress: {
        completed: totalCompleted,
        inProgress: totalInProgress,
        pending: totalPending,
        overdue: totalOverdue
      }
    })

  } catch (error) {
    console.error('Error fetching editor stats:', error)
    return NextResponse.json({ error: 'Failed to fetch editor stats' }, { status: 500 })
  }
}

  