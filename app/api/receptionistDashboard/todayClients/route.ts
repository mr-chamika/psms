import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Client } from '@/lib/models/Client'

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const clients = await Client.find({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    })
      .select('firstName lastName phoneNumber createdAt')
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('Today clients fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch today\'s clients' },
      { status: 500 }
    )
  }
}
