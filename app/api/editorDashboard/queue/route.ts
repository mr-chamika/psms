import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Order } from '@/lib/models/Order'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { requireAuth } from '@/lib/rbac/serverGuard'

export async function GET() {
  const auth = await requireAuth()
  if (!auth.ok) return auth.response
  const session = auth.session
  const userId = session.sub

  try {
    await connectDB()

    // Fetch all items assigned to the editor
    const [sittings, media, extraCopies] = await Promise.all([
      Sitting.find({ editor: userId }).lean(),
      Media.find({ editor: userId }).lean(),
      ExtraCopy.find({ editor: userId }).lean(),
    ])

    const originalNumbers = extraCopies
      .map((item: any) => item.originalNumber)
      .filter((value: string | undefined) => Boolean(value))

    const [originalSittings, originalMedia] = await Promise.all([
      Sitting.find({ sittingId: { $in: originalNumbers } }).lean(),
      Media.find({ mediaId: { $in: originalNumbers } }).lean(),
    ])

    const originalSittingMap = new Map(
      originalSittings.map((item: any) => [item.sittingId, item])
    )
    const originalMediaMap = new Map(
      originalMedia.map((item: any) => [item.mediaId, item])
    )

    const allItems = [...sittings, ...media, ...extraCopies]
    
    // Group items by orderId
    const ordersMap = new Map<string, any[]>()
    const orderIds = new Set<string>()

    allItems.forEach((item: any) => {
      if (!ordersMap.has(item.orderId)) {
        ordersMap.set(item.orderId, [])
        orderIds.add(item.orderId)
      }
      ordersMap.get(item.orderId)!.push(item)
    })

    // Fetch order details for these IDs
    const orders = await Order.find({ orderId: { $in: Array.from(orderIds) } }).lean()
    
    // Create a map for quick order lookup
    const ordersLookup = new Map<string, any>()
    orders.forEach((order: any) => {
      ordersLookup.set(order.orderId, order)
    })

    const jobs = allItems.map((item: any) => {
      const order = ordersLookup.get(item.orderId)
      
      const itemId = item.sittingId || item.mediaId || item.extraCopyId || (item._id ? item._id.toString() : 'Unknown ID')
      const remark = item.moreInfo || item.remark || ''
      const editingAddOn = item.editingAddon || item.editingAddons || ''
      
      // Calculate status for UI from item.status
      let status = 'Pending'
      const itemStatus = (item.status || 'pending')
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, '-')
      
      if (itemStatus === 'in-progress') status = 'In Progress'
      else if (itemStatus === 'completed') status = 'Completed'
      else if (itemStatus === 'cancelled') status = 'Cancelled'

      // Calculate priority for UI
      let priority = 'Normal'
      if (item.priority === 'urgent') priority = 'Urgent'
      else if (item.priority === 'high') priority = 'High'

      // For compatibility with dashboard widget which expects totalPhotos/editedPhotos
      const qty = parseInt(item.quantity) || 1
      const editedFn = status === 'Completed' ? qty : (status === 'In Progress' ? Math.floor(qty / 2) : 0) // Approximation

      const isExtraCopy = Boolean(item.extraCopyId)
      const originalSitting = isExtraCopy ? originalSittingMap.get(item.originalNumber) : null
      const originalMediaItem = isExtraCopy ? originalMediaMap.get(item.originalNumber) : null

      const originalSourceLink = isExtraCopy
        ? (originalSitting?.sourceLink || originalMediaItem?.sourceLink || null)
        : null

      const originalPhotographerStatus = isExtraCopy
        ? (originalSitting?.photographerStatus || originalMediaItem?.photographerStatus || null)
        : null

      let originalItemType = ''
      if (isExtraCopy) {
        if (originalSitting) originalItemType = 'sitting'
        else if (originalMediaItem) originalItemType = 'media'
      }

      return {
        id: itemId,
        orderId: item.orderId,
        itemId: itemId,
        client: order ? order.name : 'Unknown Client',
        title: item.item,
        remark: remark,
        editingAddOn: editingAddOn,
        sourceLink: isExtraCopy ? originalSourceLink : (item.sourceLink || null),
        editedLink: item.editedLink || null,
        editor: item.editor || null,
        photographer: item.photographer || null,
        editorStatus: item.editorStatus || null,
        photographerStatus: item.photographerStatus || null,
        isExtraCopy: isExtraCopy,
        originalItemType: originalItemType,
        originalPhotographerStatus: originalPhotographerStatus,
        totalPhotos: qty,
        editedPhotos: editedFn,
        priority: priority,
        status: status,
        deadline: item.requestedDate,
        dueDate: item.requestedDate,
        assignedTo: 'Me', // Since this is the editor's personal queue
        editorAssignedAt: item.editorAssignedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt // Fallback to createdAt if updatedAt missing
      }
    })

    // Sort by createdAt (newest first)
    jobs.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
    })

    return NextResponse.json({ jobs })

  } catch (error) {
    console.error('Error fetching editor queue:', error)
    return NextResponse.json({ error: 'Failed to fetch editor queue' }, { status: 500 })
  }
}
