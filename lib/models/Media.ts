import { Schema, model, models } from "mongoose";
import { Counter } from "./Counter";

const MediaSchema = new Schema(
  {
    mediaId: { type: String, unique: true, sparse: true },
    orderId: { type: String, required: true },
    clientIsDeleted: { type: Boolean, default: false },
    quantity: { type: String, required: true },
    item: { type: String, required: true },
    requestedDate: { type: String, required: true },
    amount: { type: String, required: true },
    discount: { type: String, default: "0" },
    laminating: {
      type: String,
      enum: ["no", "cool", "hot"],
      default: "no",
    },
    remark: String,
    editor: { type: String },
    editingAddons: String,
    sourceLink: String,
    editedLink: String,
    editorStatus: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
    },
    editorAssignedAt: { type: Date },
    priority: {
      type: String,
      enum: ["urgent", "normal"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true },
);

MediaSchema.index({ orderId: 1 });
MediaSchema.index({ orderId: 1, clientIsDeleted: 1 });

MediaSchema.pre(["find", "findOne", "findOneAndUpdate", "countDocuments"], function () {
  if (!this.getOptions().includeDeletedClients) {
    this.where({ clientIsDeleted: { $ne: true } });
  }
});

MediaSchema.pre("save", async function () {
  if (!this.mediaId) {
    const counter = await Counter.findByIdAndUpdate(
      "mediaId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    this.mediaId = `MED-${String(counter.seq).padStart(4, "0")}`;
  }
});

export const Media = models.Media || model("Media", MediaSchema);
