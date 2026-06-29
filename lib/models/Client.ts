import { Schema, model, models } from 'mongoose'
import { Order } from './Order'
import { Sitting } from './Sitting'
import { Media } from './Media'
import { ExtraCopy } from './ExtraCopy'
import { Framing } from './Framing'

const ClientSchema = new Schema(
	{
		firstName: { type: String, required: true, trim: true },
		lastName: { type: String, required: true, trim: true },
		phoneNumber: { type: String, required: true, trim: true },
		is_deleted: { type: Boolean, default: false },
		deleted_at: { type: Date, default: null },
	},
	{ timestamps: true }
)

ClientSchema.index({ phoneNumber: 1 }, { unique: true })
ClientSchema.index({ is_deleted: 1, createdAt: -1 })

// Default manager behavior: return only non-deleted clients unless explicitly overridden.
ClientSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
	if (!this.getOptions().includeDeleted) {
		this.where({ is_deleted: { $ne: true } })
	}
})

async function syncClientDeleteStateAcrossOrdersAndItems(
	clientId: string,
	isDeleted: boolean
) {
	await Order.updateMany(
		{ clientId },
		{ $set: { clientIsDeleted: isDeleted } }
	)

	const orderDocs = await Order.find({ clientId })
		.setOptions({ includeDeletedClients: true })
		.select('orderId')
		.lean()

	const orderIds = orderDocs
		.map((doc) => doc.orderId)
		.filter((orderId): orderId is string => Boolean(orderId))

	if (orderIds.length === 0) return

	await Promise.all([
		Sitting.updateMany(
			{ orderId: { $in: orderIds } },
			{ $set: { clientIsDeleted: isDeleted } }
		),
		Media.updateMany(
			{ orderId: { $in: orderIds } },
			{ $set: { clientIsDeleted: isDeleted } }
		),
		ExtraCopy.updateMany(
			{ orderId: { $in: orderIds } },
			{ $set: { clientIsDeleted: isDeleted } }
		),
		Framing.updateMany(
			{ orderId: { $in: orderIds } },
			{ $set: { clientIsDeleted: isDeleted } }
		),
	])
}

ClientSchema.methods.softDelete = async function () {
	if (this.is_deleted) return this
	this.is_deleted = true
	this.deleted_at = new Date()
	await this.save()
	await syncClientDeleteStateAcrossOrdersAndItems(String(this._id), true)
	return this
}

ClientSchema.methods.restore = async function () {
	if (!this.is_deleted) return this
	this.is_deleted = false
	this.deleted_at = null
	await this.save()
	await syncClientDeleteStateAcrossOrdersAndItems(String(this._id), false)
	return this
}

// Override delete() to perform soft-delete semantics.
ClientSchema.methods.delete = async function () {
	return this.softDelete()
}

async function ensureNoLinkedOrdersByFilter(filter: Record<string, unknown>) {
	const candidate = await Client.findOne(filter).setOptions({ includeDeleted: true }).select('_id').lean()
	if (!candidate?._id) return

	const hasOrders = await Order.exists({ clientId: candidate._id })
	if (hasOrders) {
		throw new Error('Cannot delete client with linked orders (PROTECT)')
	}
}

// Enforce PROTECT on all hard-delete paths.
ClientSchema.pre('deleteOne', { document: true, query: false }, async function () {
	const hasOrders = await Order.exists({ clientId: this._id })
	if (hasOrders) {
		throw new Error('Cannot delete client with linked orders (PROTECT)')
	}
})

ClientSchema.pre('deleteOne', { document: false, query: true }, async function () {
	await ensureNoLinkedOrdersByFilter(this.getFilter())
})

ClientSchema.pre('findOneAndDelete', async function () {
	await ensureNoLinkedOrdersByFilter(this.getFilter())
})

export const Client = models.Client || model('Client', ClientSchema)

