import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { BillingSettings } from '@/lib/models/BillingSettings'

export async function GET() {
  try {
    await connectDB()
    const settings = await BillingSettings.findOne().lean()
    return NextResponse.json(settings ?? {})
  } catch (error) {
    console.error('Failed to fetch billing settings:', error)
    return NextResponse.json({ error: 'Failed to fetch billing settings' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB()
    const { discountRows, frameTypeAmounts, frameMaterialAmounts, fSizeAmounts, itemsByType, materialCosts, inventoryItems } = await req.json()

    const settings = await BillingSettings.findOneAndUpdate(
      {},
      { discountRows, frameTypeAmounts, frameMaterialAmounts, fSizeAmounts, itemsByType, materialCosts, inventoryItems },
      { upsert: true, new: true }
    ).lean()

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to save billing settings:', error)
    return NextResponse.json({ error: 'Failed to save billing settings' }, { status: 500 })
  }
}