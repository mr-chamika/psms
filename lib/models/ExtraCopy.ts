import { Schema, model, models } from 'mongoose'
import { Counter } from './Counter'

const ExtraCopySchema = new Schema(
    {
        extraCopyId: { type: String, unique: true, sparse: true },
        orderId: { type: String, required: true },
        clientIsDeleted: { type: Boolean, default: false },
        originalNumber: { type: String, required: true },
        quantity: { type: String, required: true },
        item: { type: String, required: true },
        requestedDate: { type: String, required: true },
        amount: { type: String, required: true },
        discount: { type: String, default: '0' },
        remark: String,
        editor: { type: String },
        editingAddons: String,
        sourceLink: String,
        editedLink: String,
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

ExtraCopySchema.index({ orderId: 1 })
ExtraCopySchema.index({ orderId: 1, clientIsDeleted: 1 })

ExtraCopySchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
    if (!this.getOptions().includeDeletedClients) {
        this.where({ clientIsDeleted: { $ne: true } })
    }
})

ExtraCopySchema.pre('save', async function () {
    if (!this.extraCopyId) {
        const counter = await Counter.findByIdAndUpdate(
            'extraCopyId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        this.extraCopyId = `EXC-${String(counter.seq).padStart(4, '0')}`
    }
})

export const ExtraCopy = models.ExtraCopy || model('ExtraCopy', ExtraCopySchema)
