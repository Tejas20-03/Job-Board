import mongoose, { Schema, Document } from "mongoose";

export interface IKeyword extends Document {
  term: string;
  count: number;
}

const KeywordSchema = new Schema<IKeyword>({
  term: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
});

export default mongoose.models.Keyword ||
  mongoose.model<IKeyword>("Keyword", KeywordSchema);
