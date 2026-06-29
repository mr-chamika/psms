import { Schema, model, models } from 'mongoose'
import { Counter } from './Counter'

const InvoiceSchema = new Schema(
    {
        invoiceId: { type: String, unique: true },
        orderId: { type: String, required: true, unique: true },
        clientName: { type: String, required: true },
        amount: { type: Number, required: true },
        advance: { type: Number, default: 0 },
        balance: { type: Number, default: 0 },
        balancePaidAmount: { type: Number, default: 0 },
        fullyPaid: { type: Boolean, default: false },
        dueDate: { type: Date },
    },
    { timestamps: true }
)

InvoiceSchema.index({ orderId: 1 })

InvoiceSchema.pre('save', async function () {
    if (!this.invoiceId) {
        const counter = await Counter.findByIdAndUpdate(
            'invoiceId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        this.invoiceId = `INV-${String(counter.seq).padStart(4, '0')}`
    }
})

export const Invoice = models.Invoice || model('Invoice', InvoiceSchema)