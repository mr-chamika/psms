import { Schema, model, models } from 'mongoose'
import { Counter } from './Counter'

const FramingSchema = new Schema(
    {
        framingId: { type: String, unique: true, sparse: true },
        orderId: { type: String, required: true },
        clientIsDeleted: { type: Boolean, default: false },
        originalNumber: { type: String, required: true },
        quantity: { type: String, required: true },
        serviceType: { type: String, required: true },
        framingType: { type: String, required: true },
        photoSize: { type: String, required: true },
        frameSize: { type: String, required: true },
        requestedDate: { type: String, required: true },
        amount: { type: String, required: true },
        discount: { type: String, default: '0' },
        notes: String,
        priority: {
            type: String,
            enum: ['urgent', 'normal'],
            default: 'normal'
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled'],
            default: 'pending'
        },
    },
    { timestamps: true }
)

FramingSchema.index({ orderId: 1 })
FramingSchema.index({ orderId: 1, clientIsDeleted: 1 })

FramingSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
    if (!this.getOptions().includeDeletedClients) {
        this.where({ clientIsDeleted: { $ne: true } })
    }
})

FramingSchema.pre('save', async function () {
    if (!this.framingId) {
        const counter = await Counter.findByIdAndUpdate(
            'framingId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        this.framingId = `FRM-${String(counter.seq).padStart(4, '0')}`
    }
})

export const Framing = models.Framing || model('Framing', FramingSchema)
