import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    await connectDB();
    // Find users with the role 'editor'
    const editors = await User.find({ role: "editor" })
                                    .select("_id firstName lastName")
                                    .lean();
    return NextResponse.json(editors);
  } catch (error) {
    console.error("Error fetching editors:", error);
    return NextResponse.json(
      { error: "Failed to fetch editors" },
      { status: 500 }
    );
  }
}
