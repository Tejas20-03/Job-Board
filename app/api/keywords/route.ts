import { connectDB } from "@/lib/mongodb";
import Keyword from "@/models/Keyword";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { term, keywords } = await req.json();

    // Handle single term
    if (term && typeof term === "string") {
      const keyword = await Keyword.findOneAndUpdate(
        { term: term.toLowerCase().trim() },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );
      return NextResponse.json({ success: true, keyword });
    }

    // Handle multiple keywords from resume analysis
    if (keywords && Array.isArray(keywords)) {
      const results = [];
      for (const keyword of keywords) {
        if (typeof keyword === "string" && keyword.trim()) {
          const result = await Keyword.findOneAndUpdate(
            { term: keyword.toLowerCase().trim() },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
          );
          results.push(result);
        }
      }
      return NextResponse.json({ success: true, keywords: results });
    }

    return NextResponse.json(
      { error: "Invalid keyword term or keywords array" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error tracking keyword:", error);
    return NextResponse.json(
      { error: "Failed to track keyword" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();
    const keywords = await Keyword.find({}).sort({ count: -1 }).limit(10);
    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}
