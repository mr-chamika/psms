import { Schema, model, models } from 'mongoose'
import { Counter } from './Counter'

const SittingSchema = new Schema(
    {
        sittingId: { type: String, unique: true, sparse: true },
        orderId: { type: String, required: true },
        clientIsDeleted: { type: Boolean, default: false },
        quantity: { type: String, required: true },
        item: { type: String, required: true },
        requestedDate: { type: String, required: true },
        amount: { type: String, required: true },
        discount: { type: String, default: '0' },
        photographer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        editor: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        sittingDate: { type: String, default: '' },
        sittingTime: { type: String, default: '' },
        sittingDescription: { type: String, default: '' },
        specialInstructions: { type: String, default: '' },
        moreInfo: String,
        editingAddon: String,
        sourceLink: String,
        editedLink: String,
        photographerStatus: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled']
        },
        editorStatus: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled']
        },
        editorAssignedAt: { type: Date },
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

SittingSchema.index({ orderId: 1 })
SittingSchema.index({ orderId: 1, clientIsDeleted: 1 })

SittingSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
    if (!this.getOptions().includeDeletedClients) {
        this.where({ clientIsDeleted: { $ne: true } })
    }
})

SittingSchema.pre('save', async function () {
    if (!this.sittingId) {
        const counter = await Counter.findByIdAndUpdate(
            'sittingId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        this.sittingId = `SIT-${String(counter.seq).padStart(4, '0')}`
    }
})

export const Sitting = models.Sitting || model('Sitting', SittingSchema)
