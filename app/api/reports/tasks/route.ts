import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { PhotographerTask } from '@/lib/models/PhotographerTask'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { User } from '@/lib/models/User'

type PhotographerStatus = 'pending' | 'confirmed' | 'in_progress' | 'tentative' | 'completed' | 'cancelled'
type EditorStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

export async function GET(req: Request) {
    try {
        await connectDB()

        const url = new URL(req.url)
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')

        const now = new Date()
        const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const defaultTo = new Date().toISOString().split('T')[0]

        const fromDate = new Date(from ?? defaultFrom)
        const toDate = new Date(to ?? defaultTo)
        fromDate.setHours(0, 0, 0, 0)
        toDate.setHours(23, 59, 59, 999)

        const [photographerTasks, sittings, media, extraCopies] = await Promise.all([
            PhotographerTask.find({ scheduledAt: { $gte: fromDate, $lte: toDate } })
                .select('assignedPhotographerName status')
                .lean(),
            Sitting.find({ createdAt: { $gte: fromDate, $lte: toDate } }).select('editor status').lean(),
            Media.find({ createdAt: { $gte: fromDate, $lte: toDate } }).select('editor status').lean(),
            ExtraCopy.find({ createdAt: { $gte: fromDate, $lte: toDate } }).select('editor status').lean(),
        ])

        const editorIds = [...new Set(
            [...sittings, ...media, ...extraCopies]
                .map(item => item.editor)
                .filter(Boolean)
        )]

        const editorUsers = await User.find({ _id: { $in: editorIds } })
            .select('firstName lastName')
            .lean()
        const editorNameMap = new Map(
            editorUsers.map(u => [String(u._id), `${u.firstName} ${u.lastName}`.trim()])
        )

        const photographerMap = new Map<
            string,
            {
                name: string
                pending: number
                confirmed: number
                in_progress: number
                tentative: number
                completed: number
                cancelled: number
                total: number
            }
        >()

        for (const task of photographerTasks) {
            const name = task.assignedPhotographerName || 'Unassigned'
            if (!photographerMap.has(name)) {
                photographerMap.set(name, {
                    name,
                    pending: 0,
                    confirmed: 0,
                    in_progress: 0,
                    tentative: 0,
                    completed: 0,
                    cancelled: 0,
                    total: 0,
                })
            }

            const entry = photographerMap.get(name)
            if (!entry) continue

            const status = task.status as PhotographerStatus
            if (status in entry) {
                entry[status] += 1
            }
            entry.total += 1
        }

        const mergedEditorItems = [...sittings, ...media, ...extraCopies]
        const editorMap = new Map<
            string,
            {
                name: string
                pending: number
                'in-progress': number
                completed: number
                cancelled: number
                total: number
            }
        >()

        for (const item of mergedEditorItems) {
            const editorName = editorNameMap.get(item.editor as string) || 'Unassigned'
            if (!editorMap.has(editorName)) {
                editorMap.set(editorName, {
                    name: editorName,
                    pending: 0,
                    'in-progress': 0,
                    completed: 0,
                    cancelled: 0,
                    total: 0,
                })
            }

            const entry = editorMap.get(editorName)
            if (!entry) continue

            const status = item.status as EditorStatus
            if (status in entry) {
                entry[status] += 1
            }
            entry.total += 1
        }

        const photographers = Array.from(photographerMap.values()).sort((a, b) => b.total - a.total)
        const editors = Array.from(editorMap.values()).sort((a, b) => b.total - a.total)

        return NextResponse.json({
            photographers,
            editors,
        })
    } catch (error) {
        console.error('Task-wise reports fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch task-wise report' }, { status: 500 })
    }
}
