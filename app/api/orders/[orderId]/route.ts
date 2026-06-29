import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import { Client } from '@/lib/models/Client'

type PaymentMethod = 'cash' | 'card'

type OrderLinePayload = {
    requestedDate?: string
    amount?: string | number
    discount?: string | number
    paymentMethod?: PaymentMethod
    editorAssignedAt?: Date | string | null
    editor?: string
} & Record<string, unknown>

type OrderItemPayload = {
    _id: string;
    sitting?: OrderLinePayload
    media?: OrderLinePayload
    extraCopy?: OrderLinePayload
    framing?: OrderLinePayload
}

type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

const hasAssignment = (value: unknown) => typeof value === 'string' && value.trim().length > 0

const applyRoleStatuses = (itemType: 'sitting' | 'media' | 'extraCopy', item: Record<string, unknown>) => {
    if (itemType === 'sitting') {
        const photographerAssigned = hasAssignment(item.photographer)
        const editorAssigned = hasAssignment(item.editor)

        if (!photographerAssigned) {
            item.photographerStatus = null
        } else if (item.photographerStatus === undefined) {
            item.photographerStatus = 'pending' as TaskStatus
        }

        if (!editorAssigned) {
            item.editorStatus = null
        } else if (item.editorStatus === undefined) {
            item.editorStatus = 'pending' as TaskStatus
        }
    }

    if (itemType === 'media' || itemType === 'extraCopy') {
        const editorAssigned = hasAssignment(item.editor)
        if (!editorAssigned) {
            item.editorStatus = null
        } else if (item.editorStatus === undefined) {
            item.editorStatus = 'pending' as TaskStatus
        }
    }
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const parsed = parseFloat(value)
        return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
}

function computeDiscountRate(amount: unknown, discount: unknown): number {
    const amountNum = toNumber(amount)
    const discountNum = toNumber(discount)
    return amountNum > 0 ? Math.round((discountNum / amountNum) * 100) : 0
}

function withDiscountFields<T extends Record<string, unknown>>(item: T) {
    return {
        ...item,
        discount: item.discount ?? '0',
        discountRate: computeDiscountRate(item.amount, item.discount),
    }
}

// GET single order by orderId
export async function GET(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDB()

        const { orderId } = await params;

        const order = await Order.findOne({ orderId })
            .populate('clientId', 'firstName lastName phoneNumber')
            .lean()

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Fetch related items
        const sittings = await Sitting.find({ orderId }).lean()
        const media = await Media.find({ orderId }).lean()
        const extraCopies = await ExtraCopy.find({ orderId }).lean()
        const framings = await Framing.find({ orderId }).lean()
        return NextResponse.json({
            success: true,
            data: {
                ...order,
                sittings: sittings.map((item) => withDiscountFields(item as Record<string, unknown>)),
                media: media.map((item) => withDiscountFields(item as Record<string, unknown>)),
                extraCopies: extraCopies.map((item) => withDiscountFields(item as Record<string, unknown>)),
                framings: framings.map((item) => withDiscountFields(item as Record<string, unknown>)),
            },
        }, { status: 200 })

    } catch (error: unknown) {
        console.error('Fetch order error:', error)
        const details = error instanceof Error ? error.message : undefined
        return NextResponse.json(
            details
                ? { error: 'Failed to fetch order', details }
                : { error: 'Failed to fetch order' },
            { status: 500 }
        )
    }
}
function cleanAssignees(data: any, fields: string[]) {
    const out = { ...data };
    for (const f of fields) {
        if (!out[f]) delete out[f];
    }
    return out;
}

// PUT (update) order by orderId
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDB()

        const { orderId } = await params
        const body = (await req.json()) as {
            phone?: string
            name?: string
            items?: OrderItemPayload[]
            total?: string | number
            discount?: string | number
            advance?: string | number
            balance?: string | number
            status?: string
            paymentMethod?: string
        }

        const {
            phone,
            name,
            total,
            discount,
            advance,
            balance,
            status,
            paymentMethod
        } = body

        const items: OrderItemPayload[] = Array.isArray(body.items) ? body.items : []
        // Find existing order
        const existingOrder = await Order.findOne({ orderId })
        if (!existingOrder) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }
        // If only updating status
        if (status && items.length == 0) {
            if (status === 'closed' && (existingOrder.status !== 'completed' || !existingOrder.fullyPaid)) {
                return NextResponse.json(
                    { error: 'Order must be completed and fully paid before it can be marked as closed' },
                    { status: 400 }
                )
            }
            existingOrder.status = status
            await existingOrder.save()

            if (status === 'cancelled') {
                await Promise.all([
                    Sitting.updateMany({ orderId }, { $set: { status: 'cancelled', photographerStatus: 'cancelled', editorStatus: 'cancelled' } }),
                    Media.updateMany({ orderId }, { $set: { status: 'cancelled', editorStatus: 'cancelled' } }),
                    ExtraCopy.updateMany({ orderId }, { $set: { status: 'cancelled', editorStatus: 'cancelled' } }),
                    Framing.updateMany({ orderId }, { $set: { status: 'cancelled' } }),
                ])
            }

            return NextResponse.json({
                success: true,
                message: 'Order status updated successfully',
                orderId: existingOrder.orderId,
            }, { status: 200 })
        }

        // Full order update
        // Validation
        if (!phone || !name || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Phone, name, and at least one item are required' },
                { status: 400 }
            )
        }

        if (status === 'closed' && (existingOrder.status !== 'completed' || !existingOrder.fullyPaid)) {
            return NextResponse.json(
                { error: 'Order must be completed and fully paid before it can be marked as closed' },
                { status: 400 }
            )
        }

        // Find client by phone number
        const client = await Client.findOne({ phoneNumber: phone })

        // Check if client is registered
        if (!client) {
            return NextResponse.json(
                { error: 'Client not registered yet. Please add client first.' },
                { status: 404 }
            )
        }

        // Calculate payment breakdown
        let cashTotal = 0
        let cashDiscount = 0
        let cardTotal = 0
        let cardDiscount = 0

        items.forEach((item) => {
            const itemData = item.sitting || item.media || item.extraCopy || item.framing
            if (!itemData) return

            const amount = toNumber(itemData.amount)
            const disc = toNumber(itemData.discount)

            if (itemData.paymentMethod === 'cash') {
                cashTotal += amount
                cashDiscount += disc
            } else if (itemData.paymentMethod === 'card') {
                cardTotal += amount
                cardDiscount += disc
            }
        })

        // Update the main order
        existingOrder.phone = phone
        existingOrder.name = name
        existingOrder.clientId = client?._id || null
        existingOrder.clientIsDeleted = Boolean(client?.is_deleted)
        existingOrder.total = toNumber(total)
        existingOrder.discount = toNumber(discount)
        existingOrder.advance = toNumber(advance)
        existingOrder.balance = toNumber(balance)
        existingOrder.cashTotal = cashTotal
        existingOrder.cashDiscount = cashDiscount
        existingOrder.cardTotal = cardTotal
        existingOrder.cardDiscount = cardDiscount
        existingOrder.paymentMethod = paymentMethod

        if (status) {
            existingOrder.status = status
        }

        // Recalculate dueDate based on new items
        const requestedDatesForDue: Date[] = []
        items.forEach((item) => {
            const itemData = item.sitting || item.media || item.extraCopy || item.framing
            if (itemData?.requestedDate) {
                requestedDatesForDue.push(new Date(itemData.requestedDate))
            }
        })
        if (requestedDatesForDue.length > 0) {
            existingOrder.dueDate = new Date(Math.max(...requestedDatesForDue.map(d => d.getTime())))
        } else {
            existingOrder.dueDate = undefined
        }

        await existingOrder.save()

        if (status === 'cancelled') {
            await Promise.all([
                Sitting.updateMany({ orderId }, { $set: { status: 'cancelled', photographerStatus: 'cancelled', editorStatus: 'cancelled' } }),
                Media.updateMany({ orderId }, { $set: { status: 'cancelled', editorStatus: 'cancelled' } }),
                ExtraCopy.updateMany({ orderId }, { $set: { status: 'cancelled', editorStatus: 'cancelled' } }),
                Framing.updateMany({ orderId }, { $set: { status: 'cancelled' } }),
            ])
        }

        // Delete existing item records and create new ones
        // await Sitting.deleteMany({ orderId })
        // await Media.deleteMany({ orderId })
        // await ExtraCopy.deleteMany({ orderId })
        // await Framing.deleteMany({ orderId })

        // Create new item records

        for (const item of items) {
            if (item.sitting?.requestedDate) {
                const priority = item.sitting.urgent ? "urgent" : "normal";
                applyRoleStatuses('sitting', item.sitting)
                const _id = item._id;
                if (_id) {
                    const existingSitting = await Sitting.findById(_id).lean();
                    if (item.sitting.editor && item.sitting.editor.toString() !== existingSitting?.editor?.toString()) {
                        item.sitting.editorAssignedAt = new Date();
                    }
                    await Sitting.findByIdAndUpdate(
                        _id,
                        { $set: { ...cleanAssignees(item.sitting, ['editor', 'photographer']), priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) } },
                        { new: true, runValidators: true }
                    )
                } else {
                    const sittingData: any = { ...cleanAssignees(item.sitting, ['editor', 'photographer']), orderId, priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) };
                    if (hasAssignment(item.sitting.editor)) {
                        sittingData.editorAssignedAt = new Date();
                    }
                    const sitting = new Sitting(sittingData) // create path
                    await sitting.save()
                }
            }

            if (item.media?.requestedDate) {
                const priority = item.media.urgent ? "urgent" : "normal";
                applyRoleStatuses('media', item.media)
                const _id = item._id;
                if (_id) {
                    const existingMedia = await Media.findById(_id).lean();
                    if (item.media.editor && item.media.editor.toString() !== existingMedia?.editor?.toString()) {
                        item.media.editorAssignedAt = new Date();
                    }
                    await Media.findByIdAndUpdate(
                        _id,
                        { $set: { ...cleanAssignees(item.media, ['editor']), priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) } },
                        { new: true, runValidators: true }
                    )
                } else {
                    const mediaData: any = { ...cleanAssignees(item.media, ['editor']), orderId, priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) };
                    if (hasAssignment(item.media.editor)) {
                        mediaData.editorAssignedAt = new Date();
                    }
                    const media = new Media(mediaData) // create path
                    await media.save()
                }
            }
            if (item.extraCopy?.requestedDate) {
                const priority = item.extraCopy.urgent ? "urgent" : "normal";
                applyRoleStatuses('extraCopy', item.extraCopy)
                const _id = item._id;
                if (_id) {
                    const existingExtraCopy = await ExtraCopy.findById(_id).lean();
                    if (item.extraCopy.editor && item.extraCopy.editor.toString() !== existingExtraCopy?.editor?.toString()) {
                        item.extraCopy.editorAssignedAt = new Date();
                    }
                    await ExtraCopy.findByIdAndUpdate(
                        _id,
                        { $set: { ...cleanAssignees(item.extraCopy, ['editor']), priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) } },
                        { new: true, runValidators: true }
                    )
                } else {
                    const extraCopyData: any = { ...cleanAssignees(item.extraCopy, ['editor']), orderId, priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) };
                    if (hasAssignment(item.extraCopy.editor)) {
                        extraCopyData.editorAssignedAt = new Date();
                    }
                    const extraCopy = new ExtraCopy(extraCopyData) // create path
                    await extraCopy.save()
                }
            }
            if (item.framing?.requestedDate) {
                const priority = item.framing.urgent ? "urgent" : "normal";
                const _id = item._id;
                if (_id) {
                    await Framing.findByIdAndUpdate(
                        _id,
                        { $set: { ...item.framing, priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) } },
                        { new: true, runValidators: true }
                    )
                } else {
                    const framing = new Framing({ ...item.framing, orderId, priority, clientIsDeleted: Boolean(existingOrder.clientIsDeleted) }) // create path
                    await framing.save()
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Order updated successfully',
            orderId: existingOrder.orderId,
        }, { status: 200 })

    } catch (error: unknown) {
        console.error('Order update error:', error)
        const details = error instanceof Error ? error.message : undefined
        return NextResponse.json(
            details
                ? { error: 'Failed to update order', details }
                : { error: 'Failed to update order' },
            { status: 500 }
        )
    }
}

// PATCH — mark order as fully paid
export async function PATCH(
    _req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDB()

        const { orderId } = await params

        const order = await Order.findOne({ orderId })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        if (order.fullyPaid) {
            return NextResponse.json(
                { error: 'Order is already marked as fully paid' },
                { status: 400 }
            )
        }

        order.fullyPaid = true
        order.balancePaidAt = new Date()
        order.balancePaidAmount = order.balance
        order.advance = order.total
        order.balance = 0

        await order.save()

        return NextResponse.json({
            success: true,
            message: 'Order marked as fully paid',
        }, { status: 200 })

    } catch (error: unknown) {
        console.error('Mark as paid error:', error)
        const details = error instanceof Error ? error.message : undefined
        return NextResponse.json(
            details
                ? { error: 'Failed to mark as paid', details }
                : { error: 'Failed to mark as paid' },
            { status: 500 }
        )
    }
}

// DELETE order by orderId
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectDB()

        const { orderId } = await params

        const order = await Order.findOne({ orderId })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Delete related items
        await Sitting.deleteMany({ orderId })
        await Media.deleteMany({ orderId })
        await ExtraCopy.deleteMany({ orderId })
        await Framing.deleteMany({ orderId })

        // Delete the order
        await Order.deleteOne({ orderId })

        return NextResponse.json({
            success: true,
            message: 'Order deleted successfully',
        }, { status: 200 })

    } catch (error: unknown) {
        console.error('Order deletion error:', error)
        const details = error instanceof Error ? error.message : undefined
        return NextResponse.json(
            details
                ? { error: 'Failed to delete order', details }
                : { error: 'Failed to delete order' },
            { status: 500 }
        )
    }
}
