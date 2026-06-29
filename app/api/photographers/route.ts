import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    await connectDB();
    // Find users with the role 'photographer'
    const photographers = await User.find({ role: "photographer" })
                                    .select("_id firstName lastName")
                                    .lean();
    return NextResponse.json(photographers);
  } catch (error) {
    console.error("Error fetching photographers:", error);
    return NextResponse.json(
      { error: "Failed to fetch photographers" },
      { status: 500 }
    );
  }
}
