import { Schema, model, models } from 'mongoose'

const UserSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    role: {
      type: String,
      enum: ['admin', 'editor', 'photographer', 'receptionist'],
    },
    email: { type: String },
    password: String,
  },
  { timestamps: true }
)

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } }
  }
)

export const User = models.User || model('User', UserSchema)
