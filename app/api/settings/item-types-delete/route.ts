import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { BillingSettings } from '@/lib/models/BillingSettings'

export async function DELETE(req: NextRequest) {
    try {
        await connectDB()
        const { itemType } = await req.json()

        if (!itemType) {
            return NextResponse.json({ error: 'Item type is required' }, { status: 400 })
        }

        // Get current settings
        const settings = await BillingSettings.findOne()

        if (!settings) {
            return NextResponse.json({ error: 'Billing settings not found' }, { status: 404 })
        }

        // Remove from itemsByType
        if (settings.itemsByType && settings.itemsByType[itemType]) {
            delete settings.itemsByType[itemType]
        }

        // Remove discount row for this type
        if (settings.discountRows && Array.isArray(settings.discountRows)) {
            settings.discountRows = settings.discountRows.filter((row: any) => row.type !== itemType)
        }

        await settings.save()

        return NextResponse.json({ success: true, settings })
    } catch (error) {
        console.error('Failed to delete item type:', error)
        return NextResponse.json({ error: 'Failed to delete item type' }, { status: 500 })
    }
}
