import { Schema, model, models } from 'mongoose'
import { Counter } from './Counter'

const PhotographerTaskSchema = new Schema(
  {
    taskId: { type: String, unique: true, sparse: true },
    client: { type: String, required: true },
    sessionType: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    assignedPhotographerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedPhotographerName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'tentative', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    createdByName: { type: String, default: '' },
  },
  { timestamps: true }
)

PhotographerTaskSchema.index({ assignedPhotographerId: 1, scheduledAt: 1 })

PhotographerTaskSchema.pre('save', async function () {
  if (!this.taskId) {
    const counter = await Counter.findByIdAndUpdate(
      'photographerTaskId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    )
    this.taskId = `PTK-${String(counter.seq).padStart(4, '0')}`
  }
})

export const PhotographerTask =
  models.PhotographerTask || model('PhotographerTask', PhotographerTaskSchema)
