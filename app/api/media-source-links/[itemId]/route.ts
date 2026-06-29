import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Media } from "@/lib/models/Media";
import { Order } from "@/lib/models/Order";
import { requireAuth } from "@/lib/rbac/serverGuard";

async function resolveMediaItem(itemId: string) {
  if (itemId.startsWith("MED-")) {
    return Media.findOne({ mediaId: itemId });
  }

  return Media.findById(itemId);
}

async function resolveItemModel(itemId: string) {
  if (itemId.startsWith("MED-")) {
    return { model: Media, filter: { mediaId: itemId } };
  }

  const mediaItem = await Media.findById(itemId);
  if (mediaItem) {
    return { model: Media, filter: { _id: mediaItem._id } };
  }

  return null;
}

function getResolvedItemId(item: any) {
  return item.mediaId || item._id.toString();
}

type RouteContext = { params: Promise<{ itemId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    const { itemId } = await context.params;
    const item = await resolveMediaItem(itemId);

    if (!item) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    const order = await Order.findOne({ orderId: item.orderId }).lean();

    return NextResponse.json({
      id: getResolvedItemId(item),
      itemId: getResolvedItemId(item),
      orderId: item.orderId,
      item: item.item || "Media Item",
      orderName: order?.name || "Unknown Client",
      orderPhone: order?.phone || "",
      sourceLink: item.sourceLink || "",
      editorStatus: item.editorStatus || null,
      status: item.status || null,
      quantity: item.quantity || null,
      requestedDate: item.requestedDate || null,
    });
  } catch (error) {
    console.error("Failed to fetch media item details:", error);
    return NextResponse.json({ error: "Failed to fetch media item details" }, { status: 500 });
  }
}

export async function POST(req: Request, context: RouteContext) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();

    const { itemId } = await context.params;
    const body = await req.json();
    const sourceLink = typeof body.sourceLink === "string" ? body.sourceLink.trim() : "";

    if (!sourceLink) {
      return NextResponse.json({ error: "Source link is required" }, { status: 400 });
    }

    const item = await resolveMediaItem(itemId);

    if (!item) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    const target = await resolveItemModel(itemId);

    if (!target) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    const updatedItem = await target.model.findOneAndUpdate(
      target.filter,
      {
        $set: {
          sourceLink,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error) {
    console.error("Failed to save media source link:", error);
    return NextResponse.json({ error: "Failed to save media source link" }, { status: 500 });
  }
}
