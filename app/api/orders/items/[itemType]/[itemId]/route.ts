import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import { Order } from '@/lib/models/Order'
import { User } from '@/lib/models/User'
import { Notification } from '@/lib/models/Notifications'
import { pusherServer } from '@/lib/pusher'
import { computeAutoStatus, normalizeTaskStatus, type TaskStatus } from '@/lib/order-item-status'

type RequestedDateDoc = {
    requestedDate?: Date | string | null
}

const normalizeStatus = normalizeTaskStatus
const hasAssignment = (value?: any) => Boolean(value && String(value).trim())

const ITEM_TYPES_REQUIRING_EDITED_LINK = new Set(['sittings', 'media', 'extra-copies'])

async function assertEditedLinkBeforeEditorComplete(
    itemType: string,
    itemId: string,
    body: Record<string, unknown>,
): Promise<NextResponse | null> {
    if (!ITEM_TYPES_REQUIRING_EDITED_LINK.has(itemType)) return null
    if (normalizeStatus(String(body.editorStatus ?? '')) !== 'completed') return null

    let existing: { editorStatus?: string | null; editedLink?: string | null } | null = null
    switch (itemType) {
        case 'sittings':
            existing = await Sitting.findOne({ sittingId: itemId })
                .select('editorStatus editedLink')
                .lean()
            break
        case 'media':
            existing = await Media.findOne({ mediaId: itemId })
                .select('editorStatus editedLink')
                .lean()
            break
        case 'extra-copies':
            existing = await ExtraCopy.findOne({ extraCopyId: itemId })
                .select('editorStatus editedLink')
                .lean()
            break
    }

    if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (normalizeStatus(existing.editorStatus) === 'completed') {
        return null
    }

    const link = String(body.editedLink ?? existing.editedLink ?? '').trim()
    if (!link) {
        return NextResponse.json(
            {
                error:
                    'Add a destination link in Submit Edited Work before marking editor status as Completed.',
            },
            { status: 400 },
        )
    }

    return null
}

async function assertSourceLinkBeforePhotographerComplete(
    itemType: string,
    itemId: string,
    body: Record<string, unknown>,
): Promise<NextResponse | null> {
    if (itemType !== 'sittings') return null
    if (normalizeStatus(String(body.photographerStatus ?? '')) !== 'completed') return null

    const existing = await Sitting.findOne({ sittingId: itemId })
        .select('photographerStatus sourceLink')
        .lean()

    if (!existing) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    if (normalizeStatus(existing.photographerStatus) === 'completed') {
        return null
    }

    const link = String(existing.sourceLink ?? '').trim()
    if (!link) {
        return NextResponse.json(
            {
                error:
                    'Save the Google Drive / Storage File Path before marking photographer status as Completed.',
            },
            { status: 400 },
        )
    }

    return null
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ itemType: string; itemId: string }> }
) {
    try {
        await connectDB()

        const { itemType, itemId } = await params
        const body = await req.json()

        const completeGuard = await assertEditedLinkBeforeEditorComplete(itemType, itemId, body)
        if (completeGuard) return completeGuard

        const photographerCompleteGuard = await assertSourceLinkBeforePhotographerComplete(
            itemType,
            itemId,
            body,
        )
        if (photographerCompleteGuard) return photographerCompleteGuard

        let updatedItem
        let existingItem: any = null
        const shouldRecomputeStatus =
            Object.prototype.hasOwnProperty.call(body, 'photographerStatus') ||
            Object.prototype.hasOwnProperty.call(body, 'editorStatus') ||
            Object.prototype.hasOwnProperty.call(body, 'photographer') ||
            Object.prototype.hasOwnProperty.call(body, 'editor')

        switch (itemType) {
            case 'sittings':
                existingItem = await Sitting.findOne({ sittingId: itemId }).lean()
                if (shouldRecomputeStatus) {
                    const nextPhotographer = body.photographer ?? existingItem?.photographer
                    const nextEditor = body.editor ?? existingItem?.editor
                    const nextPhotographerStatus = body.photographerStatus ?? existingItem?.photographerStatus
                    const nextEditorStatus = body.editorStatus ?? existingItem?.editorStatus
                    const photographerAssigned = hasAssignment(nextPhotographer)
                    const editorAssigned = hasAssignment(nextEditor)

                    if (!photographerAssigned) {
                        body.photographerStatus = null
                    } else if (body.photographerStatus === undefined && !nextPhotographerStatus) {
                        body.photographerStatus = 'pending'
                    }

                    if (!editorAssigned) {
                        body.editorStatus = null
                    } else if (body.editorStatus === undefined && !nextEditorStatus) {
                        body.editorStatus = 'pending'
                    }

                    if (nextEditor && nextEditor.toString() !== existingItem?.editor?.toString()) {
                        body.editorAssignedAt = new Date()
                    }
                }

                if (body.status === undefined || body.status === null || body.status === '') {
                    const autoStatus = computeAutoStatus({
                        itemType: 'sittings',
                        existingStatus: existingItem?.status,
                        photographerStatus: body.photographerStatus ?? existingItem?.photographerStatus,
                        editorStatus: body.editorStatus ?? existingItem?.editorStatus,
                        hasPhotographer: hasAssignment(body.photographer ?? existingItem?.photographer),
                        hasEditor: hasAssignment(body.editor ?? existingItem?.editor),
                    })
                    if (autoStatus) body.status = autoStatus
                }

                updatedItem = await Sitting.findOneAndUpdate(
                    { sittingId: itemId },
                    body,
                    { new: true }
                )
                break
            case 'media':
                if (shouldRecomputeStatus) {
                    existingItem = await Media.findOne({ mediaId: itemId }).lean()
                    const nextEditor = body.editor ?? existingItem?.editor
                    const nextEditorStatus = body.editorStatus ?? existingItem?.editorStatus
                    const editorAssigned = hasAssignment(nextEditor)

                    if (!editorAssigned) {
                        body.editorStatus = null
                    } else if (body.editorStatus === undefined && !nextEditorStatus) {
                        body.editorStatus = 'pending'
                    }

                    if (nextEditor && nextEditor.toString() !== existingItem?.editor?.toString()) {
                        body.editorAssignedAt = new Date()
                    }

                    if (body.status === undefined || body.status === null || body.status === '') {
                        const autoStatus = computeAutoStatus({
                            itemType: 'media',
                            existingStatus: existingItem?.status,
                            editorStatus: nextEditorStatus,
                            hasPhotographer: false,
                            hasEditor: editorAssigned,
                        })
                        if (autoStatus) body.status = autoStatus
                    }
                }
                updatedItem = await Media.findOneAndUpdate(
                    { mediaId: itemId },
                    body,
                    { new: true }
                )
                break
            case 'extra-copies':
                if (shouldRecomputeStatus) {
                    existingItem = await ExtraCopy.findOne({ extraCopyId: itemId }).lean()
                    const nextEditor = body.editor ?? existingItem?.editor
                    const nextEditorStatus = body.editorStatus ?? existingItem?.editorStatus
                    const editorAssigned = hasAssignment(nextEditor)

                    if (!editorAssigned) {
                        body.editorStatus = null
                    } else if (body.editorStatus === undefined && !nextEditorStatus) {
                        body.editorStatus = 'pending'
                    }

                    if (nextEditor && nextEditor.toString() !== existingItem?.editor?.toString()) {
                        body.editorAssignedAt = new Date()
                    }

                    if (body.status === undefined || body.status === null || body.status === '') {
                        const autoStatus = computeAutoStatus({
                            itemType: 'extra-copies',
                            existingStatus: existingItem?.status,
                            editorStatus: nextEditorStatus,
                            hasPhotographer: false,
                            hasEditor: editorAssigned,
                        })
                        if (autoStatus) body.status = autoStatus
                    }
                }
                updatedItem = await ExtraCopy.findOneAndUpdate(
                    { extraCopyId: itemId },
                    body,
                    { new: true }
                )
                break
            case 'framings':
                updatedItem = await Framing.findOneAndUpdate(
                    { framingId: itemId },
                    body,
                    { new: true }
                )
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid item type' },
                    { status: 400 }
                )
        }

        if (!updatedItem) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            )
        }
        if (updatedItem.status === "completed" && updatedItem.priority !== "normal") {
            updatedItem.priority = "normal";
            await updatedItem.save();
        }
        // Recalculate order's dueDate after item update
        const orderId = String((updatedItem as { orderId?: unknown }).orderId ?? '')
        const sittings = (await Sitting.find({ orderId }).lean()) as unknown as RequestedDateDoc[]
        const media = (await Media.find({ orderId }).lean()) as unknown as RequestedDateDoc[]
        const extraCopies = (await ExtraCopy.find({ orderId }).lean()) as unknown as RequestedDateDoc[]
        const framings = (await Framing.find({ orderId }).lean()) as unknown as RequestedDateDoc[]

        const requestedDates: Date[] = []
        for (const item of [...sittings, ...media, ...extraCopies, ...framings]) {
            if (item.requestedDate) {
                requestedDates.push(new Date(item.requestedDate))
            }
        }

        const newDueDate = requestedDates.length > 0
            ? new Date(Math.max(...requestedDates.map(d => d.getTime())))
            : undefined

        const hasUrgent = [...sittings, ...media, ...extraCopies, ...framings].some((item: any) => item.priority === "urgent" || item.status != "completed");
        const orderDoc = await Order.findOne({ orderId });
        const update: any = { dueDate: newDueDate };
        if (orderDoc?.status !== "closed") {
            if (!hasUrgent) {
                update.status = "completed";
            } else if (orderDoc && orderDoc.status === "completed") {
                update.status = "pending";
            }
        }
        await Order.findOneAndUpdate({ orderId }, update);
        // Notify admin/receptionist when editor marks item as completed
        if (
            itemType !== 'framings' &&
            body.editorStatus === 'completed' &&
            normalizeStatus(existingItem?.editorStatus) !== 'completed'
        ) {
            const recipients = await User.find({ role: { $in: ['admin', 'receptionist'] } }).lean()
            await Promise.all(
                (recipients as any[]).map(async (user) => {
                    const recipientId = String(user._id)
                    const notification = await Notification.create({
                        recipientId,
                        type: 'editor_completed',
                        title: 'Editing completed',
                        message: `Item ${itemId} has been marked as completed for order ${orderId}.`,
                        data: { itemId, itemType, orderId },
                        read: false,
                    })
                    await pusherServer.trigger(`private-user-${recipientId}`, 'notification', {
                        _id: String(notification._id),
                        type: notification.type,
                        title: notification.title,
                        message: notification.message,
                        data: notification.data,
                        read: false,
                        createdAt: notification.createdAt,
                    })
                })
            )
        }
        if (
            itemType === 'sittings' &&
            body.photographerStatus === 'completed' &&
            normalizeStatus(existingItem?.photographerStatus) !== 'completed' &&
            !hasAssignment(existingItem?.editor)
        ) {
            const recipients = await User.find({ role: { $in: ['admin', 'receptionist'] } }).lean()
            await Promise.all(
                (recipients as any[]).map(async (user) => {
                    const recipientId = String(user._id)
                    const notification = await Notification.create({
                        recipientId,
                        type: 'photographer_completed',
                        title: 'Photography completed',
                        message: `Sitting ${itemId} has been completed by the photographer for order ${orderId}.`,
                        data: { itemId, itemType, orderId },
                        read: false,
                    })
                    await pusherServer.trigger(`private-user-${recipientId}`, 'notification', {
                        _id: String(notification._id),
                        type: notification.type,
                        title: notification.title,
                        message: notification.message,
                        data: notification.data,
                        read: false,
                        createdAt: notification.createdAt,
                    })
                })
            )
        }
        return NextResponse.json({
            success: true,
            message: 'Item updated successfully',
            data: updatedItem,
        }, { status: 200 })

    } catch (error: unknown) {
        console.error('Item update error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to update item', details: message },
            { status: 500 }
        )
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ itemType: string; itemId: string }> }
) {
    try {
        await connectDB()

        const { itemType, itemId } = await params

        let deletedItem

        switch (itemType) {
            case 'sittings':
                deletedItem = await Sitting.findOneAndDelete({ sittingId: itemId })
                break
            case 'media':
                deletedItem = await Media.findOneAndDelete({ mediaId: itemId })
                break
            case 'extra-copies':
                deletedItem = await ExtraCopy.findOneAndDelete({ extraCopyId: itemId })
                break
            case 'framings':
                deletedItem = await Framing.findOneAndDelete({ framingId: itemId })
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid item type' },
                    { status: 400 }
                )
        }

        if (!deletedItem) {
            return NextResponse.json(
                { error: 'Item not found' },
                { status: 404 }
            )
        }

        // Recalculate order's dueDate after item deletion
        const orderId = String((deletedItem as { orderId?: unknown }).orderId ?? '')
        const sittings = (await Sitting.find({ orderId }).lean()) as unknown as RequestedDateDoc[]
        const media = (await Media.find({ orderId }).lean()) as unknown as RequestedDateDoc[]
        const extraCopies = (await ExtraCopy.find({ orderId }).lean()) as unknown as RequestedDateDoc[]
        const framings = (await Framing.find({ orderId }).lean()) as unknown as RequestedDateDoc[]

        const requestedDates: Date[] = []
        for (const item of [...sittings, ...media, ...extraCopies, ...framings]) {
            if (item.requestedDate) {
                requestedDates.push(new Date(item.requestedDate))
            }
        }

        const newDueDate = requestedDates.length > 0
            ? new Date(Math.max(...requestedDates.map(d => d.getTime())))
            : undefined

        await Order.findOneAndUpdate({ orderId }, { dueDate: newDueDate })

        return NextResponse.json({
            success: true,
            message: 'Item deleted successfully',
        }, { status: 200 })

    } catch (error: unknown) {
        console.error('Item delete error:', error)
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
            { error: 'Failed to delete item', details: message },
            { status: 500 }
        )
    }
}
