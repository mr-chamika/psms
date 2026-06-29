import { Schema, model, models } from 'mongoose'

const CounterSchema = new Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
})

export const Counter = models.Counter || model('Counter', CounterSchema)
