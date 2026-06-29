
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { Framing } from '@/lib/models/Framing'
import { Client } from '@/lib/models/Client'
import { User } from '@/lib/models/User'
import mongoose from 'mongoose'
import { Notification } from '@/lib/models/Notifications'
import { pusherServer } from '@/lib/pusher'
import { computeSittingItemStatus } from '@/lib/order-item-status'

type PaymentMethod = 'cash' | 'card'

type ItemPayload = Record<string, unknown> & {
  amount?: string | number
  discount?: string | number
  paymentMethod?: PaymentMethod
  requestedDate?: string
}

type OrderItemPayload = {
  sitting?: ItemPayload
  media?: ItemPayload
  extraCopy?: ItemPayload
  framing?: ItemPayload
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
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

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error'
}

type PriorityItem = { priority?: string }

function hasUrgentItem(order: {
  media?: PriorityItem[]
  sittings?: PriorityItem[]
  extraCopies?: PriorityItem[]
  framings?: PriorityItem[]
}) {
  return (
    (order.media?.some(item => item.priority === "urgent")) ||
    (order.sittings?.some(item => item.priority === "urgent")) ||
    (order.extraCopies?.some(item => item.priority === "urgent")) ||
    (order.framings?.some(item => item.priority === "urgent"))
  );
}

export async function GET(req: Request) {
  try {
    await connectDB()

    // Check if orderId query parameter exists
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId');
    const phone = searchParams.get('phone');
    // If orderId is provided, fetch single order with all details
    if (orderId) {
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
      const sittings = await Sitting.find({ orderId })
        .select('sittingId item quantity requestedDate amount discount priority status photographerStatus editorStatus sittingDate sittingTime sittingDescription specialInstructions moreInfo editingAddon editingAddOns sourceLink editedLink photographer editor')
        .populate('photographer', 'firstName lastName _id')
        .populate('editor', 'firstName lastName _id')
        .lean()

      await Promise.all(
        sittings.map(async (sitting) => {
          const autoStatus = computeSittingItemStatus(sitting)
          if (autoStatus && sitting.status !== autoStatus) {
            await Sitting.updateOne({ sittingId: sitting.sittingId }, { $set: { status: autoStatus } })
            sitting.status = autoStatus
          }
        }),
      )

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
    } else if (phone) {

      const orders = await Order.find({ phone }).select('orderId');
      const orderIds = orders.map(o => o.orderId).filter(id => id);
      if (orderIds.length === 0) {
        return NextResponse.json(
          { success: true, orderIds: [], data: [] },
          { status: 200 }
        );
      }
      const [mediaIdsRaw, sittingIdsRaw] = await Promise.all([
        Media.distinct("mediaId", { orderId: { $in: orderIds } }),
        Sitting.distinct("sittingId", { orderId: { $in: orderIds } }),
      ]);
      const allIds = [...mediaIdsRaw, ...sittingIdsRaw].filter(
        (id): id is string => Boolean(id)
      );
      return NextResponse.json(
        {
          success: true,
          data: allIds,
        },
        { status: 200 }
      );

    }

    // Otherwise, fetch all orders (list view)
    const orders = await Order.find()
      .select('orderId name phone clientId total advance balance fullyPaid status dueDate createdAt')
      .populate({
        path: 'clientId',
        select: 'firstName lastName',
        match: { is_deleted: { $ne: true } },
      })
      .sort({ createdAt: -1 })
      .lean()

    // Keep only orders linked to active clients for admin order listing.
    const visibleOrders = orders.filter((order) => Boolean(order.clientId))

    const ordersWithUrgent = await Promise.all(
      visibleOrders.map(async (order) => {
        const media = await Media.find({ orderId: order.orderId }).lean();
        const sittings = await Sitting.find({ orderId: order.orderId }).lean();
        const extraCopies = await ExtraCopy.find({ orderId: order.orderId }).lean();
        const framings = await Framing.find({ orderId: order.orderId }).lean();

        return {
          ...order,
          isUrgent: hasUrgentItem({ media, sittings, extraCopies, framings }),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: ordersWithUrgent,
    }, { status: 200 })

  } catch (error: unknown) {
    console.error('Fetch orders error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
async function sendAssignmentNotification(
  recipientId: string,
  role: 'photographer' | 'editor',
  orderId: string,
  itemType: string,
  itemId: string
) {
  const notification = await Notification.create({
    recipientId,
    type: 'order_assigned',
    title: 'New Order Assigned',
    message: `You have been assigned as ${role} for a ${itemType} item in order ${orderId}.`,
    data: { orderId, itemType, itemId },
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
}

export async function POST(req: Request) {
  try {
    await connectDB()

    const body = await req.json()
    const {
      phone,
      name,
      items,
      total,
      discount,
      advance,
      balance,
      paymentMethod,
      fullyPaid
    } = body

    // Validation
    if (typeof phone !== 'string' || typeof name !== 'string' || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Phone, name, and at least one item are required' },
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

    for (const item of items as unknown[]) {
      if (!isRecord(item)) continue

      const typedItem = item as unknown as OrderItemPayload
      const itemData = typedItem.sitting || typedItem.media || typedItem.extraCopy || typedItem.framing
      if (!itemData) continue

      const amount = toNumber(itemData.amount)
      const disc = toNumber(itemData.discount)

      if (itemData.paymentMethod === 'cash') {
        cashTotal += amount
        cashDiscount += disc
      } else if (itemData.paymentMethod === 'card') {
        cardTotal += amount
        cardDiscount += disc
      }
    }
    // Extract all requested dates and find the latest one for dueDate
    const requestedDates: Date[] = []
    for (const item of items as unknown[]) {
      if (!isRecord(item)) continue

      const typedItem = item as unknown as OrderItemPayload
      const itemData = typedItem.sitting || typedItem.media || typedItem.extraCopy || typedItem.framing
      if (!itemData?.requestedDate) continue

      requestedDates.push(new Date(itemData.requestedDate))
    }

    // Set dueDate to the latest (maximum) requested date
    let dueDate: Date | undefined = undefined
    if (requestedDates.length > 0) {
      dueDate = new Date(Math.max(...requestedDates.map(d => d.getTime())))
    }

    // Create the main order
    const order = new Order({
      phone,
      name,
      clientId: client?._id || null,
      clientIsDeleted: Boolean(client?.is_deleted),
      total: toNumber(total),
      discount: toNumber(discount),
      advance: toNumber(advance),
      balance: toNumber(balance),
      cashTotal,
      cashDiscount,
      cardTotal,
      cardDiscount,
      status: 'pending',
      dueDate,
      paymentMethod,
      fullyPaid: Boolean(fullyPaid),
      ...(fullyPaid ? { balancePaidAt: new Date(), balancePaidAmount: toNumber(balance) } : {})
    })

    await order.save()
    const assignedStaffIds = new Set<string>()
    // Create item records
    for (const item of items) {
      if (item.sitting) {
        //const priority = calculatePriority(item.sitting.requestedDate)
        applyRoleStatuses('sitting', item.sitting)
        const sittingData: any = {
          ...item.sitting,
          orderId: order.orderId,
          clientIsDeleted: Boolean(order.clientIsDeleted),
          priority: item.sitting.urgent ? "urgent" : "normal"
        };
        delete sittingData.photographer;
        delete sittingData.editor;
        // Explicitly set the foreign keys correctly if provided
        if (item.sitting.photographer) {
          sittingData.photographer = new mongoose.Types.ObjectId(item.sitting.photographer as string);
        }
        if (item.sitting.editor) {
          sittingData.editor = new mongoose.Types.ObjectId(item.sitting.editor as string);
        }

        if (hasAssignment(item.sitting.editor)) {
          sittingData.editorAssignedAt = new Date();
        }

        const sitting = new Sitting(sittingData)
        await sitting.save();

        if (item.sitting.photographer) {
          await sendAssignmentNotification(
            String(item.sitting.photographer), 'photographer',
            order.orderId, 'sitting', sitting.sittingId
          )
          assignedStaffIds.add(String(item.sitting.photographer))
        }
        // Notify editor
        if (item.sitting.editor) {
          await sendAssignmentNotification(
            String(item.sitting.editor), 'editor',
            order.orderId, 'sitting', sitting.sittingId
          )
          assignedStaffIds.add(String(item.sitting.editor))
        }
      }

      if (item.media) {
        applyRoleStatuses('media', item.media)
        const mediaData: any = {
          ...item.media,
          orderId: order.orderId,
          clientIsDeleted: Boolean(order.clientIsDeleted),
          priority: item.media.urgent ? "urgent" : "normal"
        }
        if (!item.media.editor) delete mediaData.editor;
        if (hasAssignment(item.media.editor)) {
          mediaData.editorAssignedAt = new Date();
        }
        const media = new Media(mediaData)
        await media.save();

        if (item.media.editor) {
          await sendAssignmentNotification(
            String(item.media.editor), 'editor',
            order.orderId, 'media', media.mediaId
          )
          assignedStaffIds.add(String(item.media.editor))
        }

      }

      if (item.extraCopy) {
        applyRoleStatuses('extraCopy', item.extraCopy)
        const extraCopyData: any = {
          ...item.extraCopy,
          orderId: order.orderId,
          clientIsDeleted: Boolean(order.clientIsDeleted),
          priority: item.extraCopy.urgent ? "urgent" : "normal"
        }
        if (!item.extraCopy.editor) delete extraCopyData.editor;
        if (hasAssignment(item.extraCopy.editor)) {
          extraCopyData.editorAssignedAt = new Date();
        }
        const extraCopy = new ExtraCopy(extraCopyData)
        await extraCopy.save();

        if (item.extraCopy.editor) {
          await sendAssignmentNotification(
            String(item.extraCopy.editor), 'editor',
            order.orderId, 'extraCopy', extraCopy.extraCopyId
          )
          assignedStaffIds.add(String(item.extraCopy.editor))
        }
      }

      if (item.framing) {
        const framing = new Framing({
          ...item.framing,
          orderId: order.orderId,
          clientIsDeleted: Boolean(order.clientIsDeleted),
          priority: item.framing.urgent ? "urgent" : "normal"
        })
        await framing.save()
      }
    }
    if (assignedStaffIds.size > 0) {
      const assignedUsers = await User.find(
        { _id: { $in: Array.from(assignedStaffIds) } },
        'firstName lastName role'
      ).lean() as { _id: unknown; firstName: string; lastName: string; role: string }[]

      const staffSummary = assignedUsers
        .map(u => `${u.firstName} ${u.lastName} (${u.role})`)
        .join(', ')

      const admins = await User.find({ role: 'admin' }, '_id').lean() as { _id: unknown }[]
      await Promise.all(
        admins.map(async (admin) => {
          const adminId = String(admin._id)
          const notification = await Notification.create({
            recipientId: adminId,
            type: 'order_created',
            title: 'New Order Created',
            message: `Order ${order.orderId} has been created. Assigned: ${staffSummary}.`,
            data: { orderId: order.orderId },
            read: false,
          })
          await pusherServer.trigger(`private-user-${adminId}`, 'notification', {
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
      message: 'Order created successfully',
      orderId: order.orderId,
    }, { status: 201 })

  } catch (error: unknown) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}