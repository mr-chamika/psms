import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Sitting } from "@/lib/models/Sitting";
import { Media } from "@/lib/models/Media";
import { ExtraCopy } from "@/lib/models/ExtraCopy";
import { Order } from "@/lib/models/Order";
import { requireAuth } from "@/lib/rbac/serverGuard";

export const runtime = "nodejs";

function ymdPrefixFromRequestedDate(raw: string): string | null {
  const m = String(raw).trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function toDayNumber(ymd: string): number | null {
  const parts = ymd.split("-");
  if (parts.length !== 3) return null;
  const day = Number(parts[2]);
  return Number.isFinite(day) ? day : null;
}

function itemKind(doc: Record<string, unknown>): "Sitting" | "Media" | "Extra Copy" {
  if (doc.extraCopyId) return "Extra Copy";
  if (doc.mediaId) return "Media";
  return "Sitting";
}

function resolveItemId(doc: Record<string, unknown>): string {
  const id =
    (doc.sittingId as string) ||
    (doc.mediaId as string) ||
    (doc.extraCopyId as string) ||
    (doc._id ? String(doc._id) : "");
  return id;
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const editorId = auth.session.sub;

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year"));
    const month = Number(searchParams.get("month"));

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: "Invalid year/month query params" },
        { status: 400 },
      );
    }

    const monthPrefix = `${year}-${String(month).padStart(2, "0")}-`;

    const [sittings, media, extraCopies] = await Promise.all([
      Sitting.find({
        editor: editorId,
        requestedDate: { $regex: `^${monthPrefix}` },
      })
        .sort({ requestedDate: 1, createdAt: 1 })
        .lean(),
      Media.find({
        editor: editorId,
        requestedDate: { $regex: `^${monthPrefix}` },
      })
        .sort({ requestedDate: 1, createdAt: 1 })
        .lean(),
      ExtraCopy.find({
        editor: editorId,
        requestedDate: { $regex: `^${monthPrefix}` },
      })
        .sort({ requestedDate: 1, createdAt: 1 })
        .lean(),
    ]);

    const allDocs = [...sittings, ...media, ...extraCopies] as Record<string, unknown>[];
    const orderIds = Array.from(new Set(allDocs.map((d) => d.orderId).filter(Boolean) as string[]));

    const orders = await Order.find({ orderId: { $in: orderIds } })
      .select("orderId name phone clientId")
      .populate("clientId", "firstName lastName")
      .lean();

    const orderMap = new Map<string, (typeof orders)[0]>();
    orders.forEach((o: any) => orderMap.set(o.orderId, o));

    const data = allDocs.flatMap((item) => {
      const rawDate = String(item.requestedDate || "");
      const ymd = ymdPrefixFromRequestedDate(rawDate);
      if (!ymd) return [];

      const day = toDayNumber(ymd);

      const order = orderMap.get(item.orderId as string);
      const clientName = order?.clientId
        ? `${(order.clientId as any).firstName || ""} ${(order.clientId as any).lastName || ""}`.trim()
        : order?.name || "Unknown Client";

      if (day === null) return [];

      const editorStatus = String(item.editorStatus || "pending")
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-");

      const itemStatus = String(item.status || "pending")
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-");

      let uiStatus = "Pending";
      if (itemStatus === "in-progress") uiStatus = "In Progress";
      else if (itemStatus === "completed") uiStatus = "Completed";
      else if (itemStatus === "cancelled") uiStatus = "Cancelled";

      const priorityRaw = String(item.priority || "normal").toLowerCase();
      let priority = "Normal";
      if (priorityRaw === "urgent") priority = "Urgent";
      else if (priorityRaw === "high") priority = "High";

      const itemId = resolveItemId(item);
      const kind = itemKind(item);
      const title = String(item.item || kind);

      return [
        {
          id: `${itemId}-${ymd}`,
          itemId,
          orderId: item.orderId as string,
          itemType: kind,
          title,
          clientName,
          date: ymd,
          day,
          editorStatus,
          priority,
          orderItemStatus: uiStatus,
        },
      ];
    });

    data.sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      if (da !== db) return da.localeCompare(db);
      return a.itemId.localeCompare(b.itemId);
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching editor calendar tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch editor calendar tasks" },
      { status: 500 },
    );
  }
}
