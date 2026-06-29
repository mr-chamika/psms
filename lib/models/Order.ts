import { Schema, model, models } from 'mongoose'
import { Counter } from './Counter'

const OrderSchema = new Schema(
    {
        orderId: { type: String, unique: true },
        phone: { type: String, required: true },
        name: { type: String, required: true },
        // Foreign key to Client. Hard-delete of Client is protected at model/api level.
        clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
        // Denormalized state synced from Client.is_deleted for fast filtering.
        clientIsDeleted: { type: Boolean, default: false },

        // Financial summary
        total: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        advance: { type: Number, default: 0 },
        balance: { type: Number, required: true },

        // Payment breakdown
        cashTotal: { type: Number, default: 0 },
        cashDiscount: { type: Number, default: 0 },
        cardTotal: { type: Number, default: 0 },
        cardDiscount: { type: Number, default: 0 },

        paymentMethod: {
            type: String,
            enum: ['cash', 'card', 'bank transfer', 'online transfer'],
            required: true
        },
        // Order status
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'completed', 'cancelled', 'closed'],
            default: 'pending'
        },

        // Due date
        dueDate: { type: Date },

        // Payment completion tracking
        fullyPaid: { type: Boolean, default: false },
        balancePaidAt: { type: Date, default: null },
        balancePaidAmount: { type: Number, default: 0 },

    },
    { timestamps: true }
)

OrderSchema.index({ clientId: 1, clientIsDeleted: 1 })

// Hide orders linked to soft-deleted clients by default.
OrderSchema.pre(['find', 'countDocuments'], function () {
    if (!this.getOptions().includeDeletedClients) {
        this.where({ clientIsDeleted: { $ne: true } })
    }
})

OrderSchema.pre('save', async function () {
    if (!this.orderId) {
        const counter = await Counter.findByIdAndUpdate(
            'orderId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        this.orderId = `ORD-${String(counter.seq).padStart(4, '0')}`
    }
})

export const Order = models.Order || model('Order', OrderSchema)
