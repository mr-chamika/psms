import { User } from '@/lib/models/User'
import { connectDB } from '@/lib/db'

export async function getAllUsers() {
  await connectDB()
  return User.find()
}

export async function getUsersByRole(role: string) {
  await connectDB()
  return User.find({ role: role }).select('firstName lastName').lean()
}

export async function getUserById(id: string) {
  await connectDB()
  return User.findById(id)
}

export async function createUser(data: {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role?: 'admin' | 'editor' | 'photographer' | 'receptionist'
  email: string
  password: string
}) {
  await connectDB()
  return User.create(data)
}

export async function addUser(data: {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  role?: 'admin' | 'editor' | 'photographer' | 'receptionist'
  email: string
  password: string
}) {
  return createUser({
    ...data,
    email: data.email.trim().toLowerCase(),
  })
}

export async function findUserByEmail(email: string) {
  await connectDB();
  return User.findOne({ email: email.trim().toLowerCase() }).exec();
}
