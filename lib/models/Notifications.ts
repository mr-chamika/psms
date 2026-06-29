import { Schema, model, models } from 'mongoose'

const NotificationSchema = new Schema(
    {
        recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        data: { type: Schema.Types.Mixed },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
)

NotificationSchema.index({ recipientId: 1, read: 1 })

export const Notification = models.Notification || model('Notification', NotificationSchema)
