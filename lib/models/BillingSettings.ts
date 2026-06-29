import { Schema, model, models } from 'mongoose'

const BillingSettingsSchema = new Schema(
  {
    discountRows: { type: Schema.Types.Mixed, default: [] },
    frameTypeAmounts: { type: Schema.Types.Mixed, default: {} },
    frameMaterialAmounts: { type: Schema.Types.Mixed, default: {} },
    fSizeAmounts: { type: Schema.Types.Mixed, default: {} },
    itemsByType: { type: Schema.Types.Mixed, default: {} },
    inventoryItems: { type: Schema.Types.Mixed, default: [] },
    materialCosts: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true }
)

export const BillingSettings = models.BillingSettings || model('BillingSettings', BillingSettingsSchema)