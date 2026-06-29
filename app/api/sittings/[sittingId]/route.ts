import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'

export const runtime = 'nodejs'

const toId = (value: unknown): string => {
    if (typeof value === 'string') {
        return value.trim()
    }

    if (value && typeof value === 'object' && '_id' in value) {
        const candidate = value as { _id?: unknown }
        if (typeof candidate._id === 'string') {
            return candidate._id.trim()
        }
    }

    return ''
}

// GET a single sitting by sittingId
export async function GET(
    req: Request,
    { params }: { params: Promise<{ sittingId: string }> }
) {
    await connectDB()
    const { sittingId } = await params

    const sitting = await Sitting.findOne({ sittingId }).lean()

    if (!sitting) {
        return NextResponse.json(
            { success: false, error: 'Sitting not found' },
            { status: 404 }
        )
    }

    return NextResponse.json({ success: true, data: sitting })
}

// PUT update sitting session details
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ sittingId: string }> }
) {
    try {
        await connectDB()
        const { sittingId } = await params

        const body = await req.json()
        const {
            sittingDate,
            sittingTime,
            sittingDescription,
            specialInstructions,
            photographer,
            editor,
            status
        } = body

        const existingSitting = await Sitting.findOne({ sittingId }).lean()

        if (!existingSitting) {
            return NextResponse.json(
                { success: false, error: 'Sitting not found' },
                { status: 404 }
            )
        }

        const $set: Record<string, unknown> = {}
        const $unset: Record<string, 1> = {}

        if (!existingSitting) {
            return NextResponse.json(
                { success: false, error: 'Sitting not found' },
                { status: 404 }
            )
        }

        if (sittingDate !== undefined) $set.sittingDate = sittingDate || ''
        if (sittingTime !== undefined) $set.sittingTime = sittingTime || ''
        if (sittingDescription !== undefined) $set.sittingDescription = sittingDescription || ''
        if (specialInstructions !== undefined) $set.specialInstructions = specialInstructions || ''
        if (status !== undefined) $set.status = status

        if (photographer !== undefined) {
            if (photographer) $set.photographer = photographer;
            else $unset.photographer = 1;
        }
        if (editor !== undefined) {
            if (editor) $set.editor = editor;
            if ($set.editor && $set.editor.toString() !== existingSitting.editor?.toString()) {
                $set.editorAssignedAt = new Date()
            }
            else $unset.editor = 1;
        }

        const updateQuery: any = {}
        if (Object.keys($set).length > 0) updateQuery.$set = $set
        if (Object.keys($unset).length > 0) updateQuery.$unset = $unset

        const sitting = await Sitting.findOneAndUpdate(
            { sittingId },
            updateQuery,
            { new: true }
        )

        if (!sitting) {
            return NextResponse.json(
                { success: false, error: 'Sitting not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true, data: sitting })
    } catch (error) {
        console.error('Failed to update sitting:', error)
        const message = error instanceof Error ? error.message : 'Failed to update sitting'
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        )
    }
}
