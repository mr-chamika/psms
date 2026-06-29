import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { Order } from "@/lib/models/Order";
import { requireAuth } from "@/lib/rbac/serverGuard";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    const mediaItems = await Media.find({}).lean();
    const orderIds = Array.from(new Set(mediaItems.map((item: any) => item.orderId).filter(Boolean)));
    const orders = await Order.find({ orderId: { $in: orderIds } }).lean();

    const orderMap = new Map<string, any>();
    orders.forEach((order: any) => {
      orderMap.set(order.orderId, order);
    });

    const items = mediaItems
      .map((item: any) => {
        const order = orderMap.get(item.orderId);
        const itemId = item.mediaId || item._id.toString();
        const rawClientId = order?.clientId;
        const clientId =
          rawClientId == null
            ? null
            : typeof rawClientId === "string"
              ? rawClientId
              : String(rawClientId);

        return {
          id: itemId,
          orderId: item.orderId,
          itemId,
          item: item.item || "Media Item",
          orderName: order?.name || "Unknown Client",
          clientId,
          sourceLink: item.sourceLink || "",
          editorStatus: item.editorStatus || null,
          status: item.status || null,
          quantity: item.quantity || null,
          requestedDate: item.requestedDate || null,
          createdAt: item.createdAt || null,
        };
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch media source items:", error);
    return NextResponse.json({ error: "Failed to fetch media source items" }, { status: 500 });
  }
}
