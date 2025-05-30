import { connectDB } from "@/lib/mongodb";
import Job from "@/models/Job";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || "";
    const keywords = searchParams.get("keywords");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    if (!query && !keywords) {
      return NextResponse.json({ jobs: [], total: 0, page, totalPages: 0 });
    }

    let searchConditions: any;

    if (keywords) {
      const keywordArray = keywords
        .split(",")
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      const keywordConditions = keywordArray.map((keyword: string) => ({
        $or: [
          { job_title: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
          { company_name: { $regex: keyword, $options: "i" } },
          { job_location: { $regex: keyword, $options: "i" } },
        ],
      }));

      searchConditions = {
        $or: keywordConditions,
      };
    } else {
      searchConditions = {
        $or: [
          { job_title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { company_name: { $regex: query, $options: "i" } },
          { job_location: { $regex: query, $options: "i" } },
        ],
      };
    }

    const total = await Job.countDocuments(searchConditions);
    const totalPages = Math.ceil(total / limit);

    const jobs = await Job.find(searchConditions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      jobs,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      searchType: keywords ? "keywords" : "query",
      keywordsUsed: keywords ? keywords.split(",").length : 0,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
