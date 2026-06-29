import { Schema, model, models } from 'mongoose'

const StudioInfoSchema = new Schema(
  {
    studioName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true }
)

export const StudioInfo = models.StudioInfo || model('StudioInfo', StudioInfoSchema)