import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const size = searchParams.get('size')

  if (!size) return NextResponse.json({ inUse: false })

  const [sittingCount, mediaCount, extraCopyCount, framingCount] = await Promise.all([
    Sitting.countDocuments({ item: size }),
    Media.countDocuments({ item: size }),
    ExtraCopy.countDocuments({ item: size }),
    Framing.countDocuments({ photoSize: size }),
  ])

  const count = sittingCount + mediaCount + extraCopyCount + framingCount
  return NextResponse.json({ inUse: count > 0, count })
}
