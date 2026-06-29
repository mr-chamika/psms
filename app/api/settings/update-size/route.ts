import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'

export async function PUT(req: NextRequest) {
    await connectDB()
    const { oldSize, newSize } = await req.json()

    if (!oldSize || !newSize) {
        return NextResponse.json({ error: 'oldSize and newSize are required' }, { status: 400 })
    }

    await Promise.all([
        Sitting.updateMany({ item: oldSize }, { $set: { item: newSize } }),
        Media.updateMany({ item: oldSize }, { $set: { item: newSize } }),
        ExtraCopy.updateMany({ item: oldSize }, { $set: { item: newSize } }),
        Framing.updateMany({ photoSize: oldSize }, { $set: { photoSize: newSize } }),
    ])

    return NextResponse.json({ success: true })
}
