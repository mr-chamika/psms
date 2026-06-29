import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { StudioInfo } from '@/lib/models/StudioInfo'

export async function GET() {
  try {
    await connectDB()
    const info = await StudioInfo.findOne().lean()
    return NextResponse.json(info ?? {})
  } catch (error) {
    console.error('Failed to fetch studio info:', error)
    return NextResponse.json({ error: 'Failed to fetch studio info' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB()
    const body = await req.json()
    const { studioName, email, phone, website, address } = body

    const info = await StudioInfo.findOneAndUpdate(
      {},
      { studioName, email, phone, website, address },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json(info)
  } catch (error) {
    console.error('Failed to save studio info:', error)
    return NextResponse.json({ error: 'Failed to save studio info' }, { status: 500 })
  }
}