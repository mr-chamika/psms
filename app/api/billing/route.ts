import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Invoice } from '@/lib/models/Invoice'
import { Order } from '@/lib/models/Order'

export async function GET() {
    try {
        await connectDB()

        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const weekStart = new Date(todayStart)
        weekStart.setDate(weekStart.getDate() - 6)

        // Backfill: create invoices for any existing orders that don't have one
        const [allOrders, existingInvoices] = await Promise.all([
            Order.find().select('orderId name total advance balance balancePaidAmount fullyPaid dueDate createdAt').lean(),
            Invoice.find().select('orderId').lean(),
        ])

        const invoicedOrderIds = new Set(existingInvoices.map(inv => inv.orderId))
        const unlinkedOrders = allOrders.filter(o => !invoicedOrderIds.has(o.orderId))

        if (unlinkedOrders.length > 0) {
            await Promise.all(
                unlinkedOrders.map(order =>
                    new Invoice({
                        orderId: order.orderId,
                        clientName: order.name,
                        amount: order.total,
                        advance: order.advance,
                        balance: order.balance,
                        balancePaidAmount: order.balancePaidAmount ?? 0,
                        fullyPaid: order.fullyPaid,
                        dueDate: order.dueDate,
                    }).save()
                )
            )
        }

        // Now fetch all invoices
        const invoices = await Invoice.find().sort({ createdAt: -1 }).lean()

        // Build invoice rows with derived status
        const invoiceRows = invoices.map(inv => {
            const paid = (inv.advance ?? 0) + (inv.balancePaidAmount ?? 0)
            let status: string
            if (inv.fullyPaid) {
                status = 'Paid'
            } else if (inv.dueDate && new Date(inv.dueDate) < now && (inv.balance ?? 0) > 0) {
                status = 'Overdue'
            } else if ((inv.advance ?? 0) > 0) {
                status = 'Partial Payment'
            } else {
                status = 'Pending'
            }

            return {
                invoiceId: inv.invoiceId,
                client: inv.clientName,
                issueDate: new Date(inv.createdAt).toISOString().split('T')[0],
                dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
                amount: inv.amount ?? 0,
                paid,
                status,
                orderId: inv.orderId
            }
        })

        // Stat cards
        const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
        const collected = invoices.reduce((sum, inv) => sum + (inv.advance ?? 0) + (inv.balancePaidAmount ?? 0), 0)

        let pending = 0
        let overdue = 0
        for (const inv of invoices) {
            if (inv.fullyPaid) continue
            const bal = inv.balance ?? 0
            if (inv.dueDate && new Date(inv.dueDate) < now) {
                overdue += bal
            } else {
                pending += bal
            }
        }

        // Weekly revenue chart
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weeklyMap: { name: string; revenue: number; pending: number }[] = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date(todayStart)
            d.setDate(d.getDate() - i)
            weeklyMap.push({ name: dayNames[d.getDay()], revenue: 0, pending: 0 })
        }

        const weekInvoices = invoices.filter(inv => new Date(inv.createdAt) >= weekStart)
        for (const inv of weekInvoices) {
            const day = dayNames[new Date(inv.createdAt).getDay()]
            const entry = weeklyMap.find(e => e.name === day)
            if (entry) {
                entry.revenue += inv.advance ?? 0
                entry.pending += inv.balance ?? 0
            }
        }

        return NextResponse.json({
            success: true,
            invoices: invoiceRows,
            stats: { totalInvoiced, collected, pending, overdue },
            weeklyRevenue: weeklyMap,
        })
    } catch (error) {
        console.error('Billing fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 })
    }
}