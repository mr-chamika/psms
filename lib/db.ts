import mongoose from 'mongoose'
import { Sitting } from './models/Sitting'
import { Media } from './models/Media'
import { Framing } from './models/Framing'
import { ExtraCopy } from './models/ExtraCopy'
import { User } from './models/User'
import { Client } from './models/Client'

const MONGODB_URI = process.env.MONGODB_URI!
let indexesSynced = false

export async function connectDB() {
  if (mongoose.connection.readyState < 1) {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })
  }

  if (!indexesSynced) {
    try {
      await Promise.all([
        User.syncIndexes(),
        Client.syncIndexes(),
        Sitting.syncIndexes(),
        Media.syncIndexes(),
        Framing.syncIndexes(),
        ExtraCopy.syncIndexes()
      ])
      indexesSynced = true
    } catch (error) {
      console.warn('Failed to sync indexes:', error)
    }
  }
}
