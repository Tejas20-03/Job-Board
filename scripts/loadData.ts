import { connectDB } from "../lib/mongodb";
import Job from "../models/Job";
import fs from "fs";
import path from "path";

interface JobData {
  job_title: string;
  company_name: string;
  job_location: string;
  apply_link: string;
  description: string;
  source?: string;
}

async function loadJobsFromJsonl() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    console.log("Clearing existing jobs...");
    await Job.deleteMany({});

    const filePath = path.join(process.cwd(), "data", "jobs.jsonl");

    if (!fs.existsSync(filePath)) {
      console.error("jobs.jsonl file not found in data directory");
      console.log(
        "Please download the file and place it in the data directory"
      );
      return;
    }

    console.log("Reading JSONL file...");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const lines = fileContent.trim().split("\n");
    const jobs: JobData[] = [];

    for (let i = 0; i < lines.length; i++) {
      try {
        const job = JSON.parse(lines[i]);

        if (
          job.job_title &&
          job.company_name &&
          job.job_location &&
          job.apply_link &&
          job.job_description
        ) {
          jobs.push({
            job_title: job.job_title.trim(),
            company_name: job.company_name.trim(),
            job_location: job.job_location.trim(),
            apply_link: job.apply_link.trim(),
            description: job.job_description.trim(),
            source: job.source?.trim() || "Unknown",
          });
        } else {
          console.warn(`Skipping invalid job at line ${i + 1}`);
          console.warn(`Missing fields:`, {
            job_title: !!job.job_title,
            company_name: !!job.company_name,
            job_location: !!job.job_location,
            apply_link: !!job.apply_link,
            job_description: !!job.job_description,
          });
        }
      } catch (error) {
        console.warn(`Error parsing line ${i + 1}:`, error);
      }
    }

    console.log(`Parsed ${jobs.length} valid jobs from ${lines.length} lines`);

    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      await Job.insertMany(batch);
      insertedCount += batch.length;
      console.log(
        `Inserted batch ${
          Math.floor(i / batchSize) + 1
        } - Total: ${insertedCount}/${jobs.length}`
      );
    }

    console.log(
      `✅ Successfully loaded ${insertedCount} jobs into the database`
    );

    console.log("Creating search indexes...");

    await Job.collection.createIndex({
      job_title: "text",
      description: "text",
      company_name: "text",
    });

    await Job.collection.createIndex({ job_title: 1 });
    await Job.collection.createIndex({ company_name: 1 });
    await Job.collection.createIndex({ job_location: 1 });
    await Job.collection.createIndex({ createdAt: -1 });

    console.log("✅ Search indexes created successfully");
  } catch (error) {
    console.error("❌ Error loading jobs:", error);
  } finally {
    process.exit(0);
  }
}

loadJobsFromJsonl();
