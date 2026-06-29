import { NextResponse, NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { requireAuth } from '@/lib/rbac/serverGuard'
import { computeSittingItemStatus } from '@/lib/order-item-status'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    const photographerId = auth.session.sub

    try {
        const { sittingId, storagePath } = await request.json()

        if (!sittingId || !storagePath) {
            return NextResponse.json(
                { success: false, error: 'sittingId and storagePath are required' },
                { status: 400 }
            )
        }

        await connectDB()

        // Find the sitting and verify it belongs to the photographer
        const sitting = await Sitting.findOne({
            sittingId: sittingId,
            photographer: photographerId
        })

        if (!sitting) {
            return NextResponse.json(
                { success: false, error: 'Sitting not found or unauthorized' },
                { status: 404 }
            )
        }

        // Update the sitting with the source link and sync overall item status
        sitting.sourceLink = storagePath
        const autoStatus = computeSittingItemStatus(sitting)
        if (autoStatus) {
            sitting.status = autoStatus
        }
        await sitting.save()

        return NextResponse.json({
            success: true,
            message: 'Storage path saved successfully',
            data: {
                sittingId: sitting.sittingId,
                sourceLink: sitting.sourceLink
            }
        })
    } catch (error) {
        console.error('Error saving storage path:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save storage path' },
            { status: 500 }
        )
    }
}
