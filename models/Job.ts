import mongoose, { Schema, model, models } from "mongoose";

const jobSchema = new Schema(
  {
    job_title: { type: String, required: true },
    company_name: { type: String, required: true },
    job_location: { type: String, required: true },
    apply_link: { type: String, required: true },
    description: { type: String, required: true },
    source: { type: String },
  },
  { timestamps: true }
);

const Job = models.Job || model("Job", jobSchema);
export default Job;
