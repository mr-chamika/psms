import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env')
  process.exit(1)
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    role: { type: String, enum: ['admin', 'editor', 'photographer', 'receptionist'] },
    email: { type: String },
    password: String,
  },
  { timestamps: true }
)
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } })

const StudioInfoSchema = new mongoose.Schema(
  {
    studioName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true }
)

const BillingSchema = new mongoose.Schema({
  discountRows: { type: Array, default: [] },
  frameMaterialAmounts: { type: Object, default: {} },
  fSizeAmounts: { type: Object, default: {} },
  itemsByType: { type: Object, default: {} },
  materialCosts: { type: Array, default: [] },
  inventoryItems: { type: Array, default: [] },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const StudioInfo = mongoose.models.StudioInfo || mongoose.model('StudioInfo', StudioInfoSchema)
const Billing = mongoose.models.BillingSettings || mongoose.model('BillingSettings', BillingSchema)

// ── Config — edit these before running ───────────────────────────────────────

const ADMIN = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@psms.com',
  password: 'Admin@1234',
  phoneNumber: '0771234567',
  role: 'admin',
}

const STUDIO = {
  studioName: 'My Studio',
  email: 'studio@example.com',
  phone: '0112345678',
  website: 'https://mystudio.com',
  address: '123 Main Street, Colombo',
}

const INITIAL_BILLING = {
  discountRows: [
    { id: 1, type: 'Sittings', rate: '5' },
    { id: 2, type: 'Frames', itemDiscountRate: '12', frameMaterialDiscountRate: '29', fSizeDiscountRate: '3' },
    { id: 3, type: 'Media', rate: '10' },
    { id: 4, type: 'Extra Copies', rate: '14' },
  ],
  itemsByType: {
    Sittings: [
      { size: '3.5x4.5 cm', amount: 2304 },
      { size: '3x4 cm', amount: 300 },
      { size: '4 x 5 cm', amount: 260 },
      { size: 'Passport', amount: 300 },
      { size: 'NIC', amount: 210 },
      { size: 'Stamp (2.5x3Cm)', amount: 180 },
      { size: 'Green Card', amount: 320 },
      { size: '2x2.5 in (DL)', amount: 220 },
      { size: 'Postel ID', amount: 210 },
      { size: '2x2 in', amount: 200 },
      { size: 'Image (3.5x4.5)', amount: 230 },
      { size: 'Image (social media)', amount: 210 },
      { size: 'Image (4R 200dpi)', amount: 250 },
      { size: 'Image (4R 300dpi)', amount: 260 },
      { size: 'Image (Commercial)', amount: 350 },
      { size: 'Double Side (Canada.PR)', amount: 400 },
      { size: 'Rathne Gal Katayam', amount: 270 },
      { size: '4R', amount: 200 },
      { size: '4x8', amount: 210 },
      { size: '5x7', amount: 220 },
      { size: '6x6', amount: 230 },
      { size: '6x8', amount: 240 },
      { size: '6x9', amount: 250 },
      { size: '6x10', amount: 260 },
      { size: '6x12', amount: 270 },
      { size: '6x18', amount: 280 },
      { size: '6x20', amount: 290 },
      { size: '8x8', amount: 300 },
      { size: '8x10', amount: 310 },
      { size: '8x12', amount: 320 },
      { size: '8x13', amount: 330 },
      { size: '8x16', amount: 340 },
      { size: '8x20', amount: 350 },
      { size: '8x24', amount: 360 },
      { size: '10x10', amount: 370 },
      { size: '10x12', amount: 380 },
      { size: '10x12 (with Mount)', amount: 390 },
      { size: '10x15', amount: 400 },
      { size: '10x18', amount: 410 },
      { size: '10x20', amount: 420 },
      { size: '10x24', amount: 430 },
      { size: '12x12', amount: 440 },
      { size: '12x15', amount: 450 },
      { size: '12x16', amount: 460 },
      { size: '12x18', amount: 470 },
      { size: '12x20', amount: 480 },
      { size: '12x24', amount: 490 },
      { size: '16x20', amount: 500 },
      { size: '16x24', amount: 510 },
      { size: '20x24', amount: 520 },
      { size: '20x30', amount: 530 },
      { size: '24x36', amount: 540 },
    ],
    Media: [
      { size: '3.5x4.5 cm', amount: 200 },
      { size: '3x4 cm', amount: 180 },
      { size: '3.5x5 cm', amount: 210 },
      { size: '4 x 5 cm', amount: 220 },
      { size: 'Stamp (2.5x3Cm)', amount: 150 },
      { size: '2x2.5 in (DL)', amount: 160 },
      { size: 'Postel ID', amount: 170 },
      { size: '2x2 in', amount: 180 },
      { size: '4R', amount: 190 },
      { size: '4x8', amount: 200 },
      { size: '5x7', amount: 210 },
      { size: '6x6', amount: 220 },
      { size: '6x8', amount: 230 },
      { size: '6x9', amount: 240 },
      { size: '6x10', amount: 250 },
      { size: '6x12', amount: 260 },
      { size: '6x18', amount: 270 },
      { size: '6x20', amount: 280 },
      { size: '8x8', amount: 290 },
      { size: '8x10', amount: 300 },
      { size: '8x12', amount: 310 },
      { size: '8x13', amount: 320 },
      { size: '8x16', amount: 330 },
      { size: '8x20', amount: 340 },
      { size: '8x24', amount: 350 },
      { size: '10x10', amount: 360 },
      { size: '10x12', amount: 370 },
      { size: '10x12 (with Mount)', amount: 380 },
      { size: '10x15', amount: 390 },
      { size: '10x18', amount: 400 },
      { size: '10x20', amount: 410 },
      { size: '10x24', amount: 420 },
      { size: '12x12', amount: 430 },
      { size: '12x15', amount: 440 },
      { size: '12x16', amount: 450 },
      { size: '12x18', amount: 460 },
      { size: '12x20', amount: 470 },
      { size: '12x24', amount: 480 },
      { size: '16x20', amount: 490 },
      { size: '16x24', amount: 500 },
      { size: '20x24', amount: 510 },
      { size: '20x30', amount: 520 },
      { size: '24x36', amount: 530 },
    ],
    Frames: [
      { size: '4R', amount: 110 },
      { size: '4x8', amount: 120 },
      { size: '5x7', amount: 130 },
      { size: '6x6', amount: 140 },
      { size: '6x8', amount: 150 },
      { size: '6x9', amount: 160 },
      { size: '6x10', amount: 170 },
      { size: '6x12', amount: 180 },
      { size: '6x18', amount: 190 },
      { size: '6x20', amount: 200 },
      { size: '8x8', amount: 210 },
      { size: '8x10', amount: 220 },
      { size: '8x12', amount: 230 },
      { size: '8x13', amount: 240 },
      { size: '8x16', amount: 250 },
      { size: '8x20', amount: 260 },
      { size: '8x24', amount: 270 },
      { size: '10x10', amount: 280 },
      { size: '10x12', amount: 290 },
      { size: '10x15', amount: 300 },
      { size: '10x18', amount: 310 },
      { size: '10x20', amount: 320 },
      { size: '10x24', amount: 330 },
      { size: '12x12', amount: 340 },
      { size: '12x15', amount: 350 },
      { size: '12x16', amount: 360 },
      { size: '12x18', amount: 370 },
      { size: '12x20', amount: 380 },
      { size: '12x24', amount: 390 },
      { size: '16x20', amount: 400 },
      { size: '16x24', amount: 410 },
      { size: '20x20', amount: 420 },
      { size: '20x24', amount: 430 },
      { size: '20x30', amount: 440 },
      { size: '24x36', amount: 460 },
      { size: '3R', amount: 505 },
    ],
    'Extra Copies': [
      { size: '3.5x4.5 cm', amount: 120 },
      { size: '3x4 cm', amount: 110 },
      { size: '3.5x5 cm', amount: 130 },
      { size: '4 x 5 cm', amount: 140 },
      { size: 'Recipt copy (NIC/Pass.P)', amount: 100 },
      { size: 'First time copy (NIC/Pass.P)', amount: 105 },
      { size: 'Stamp (2.5x3Cm)', amount: 115 },
      { size: 'Green Card', amount: 125 },
      { size: '2x2.5 in (DL)', amount: 135 },
      { size: 'Postel ID', amount: 145 },
      { size: '2x2 in', amount: 155 },
      { size: 'Image (First Time NIC/Pass.P)', amount: 165 },
      { size: 'Image (3.5x4.5)', amount: 175 },
      { size: 'Image (social media)', amount: 185 },
      { size: 'Image (4R 200dpi)', amount: 195 },
      { size: 'Image (4R 300dpi)', amount: 205 },
      { size: 'Image (Commercial)', amount: 215 },
      { size: 'Double Side (Canada.PR)', amount: 225 },
      { size: 'Rathne Gal Katayam', amount: 235 },
      { size: '4R', amount: 245 },
      { size: '4x8', amount: 255 },
      { size: '5x7', amount: 265 },
      { size: '6x6', amount: 275 },
      { size: '6x8', amount: 285 },
      { size: '6x9', amount: 295 },
      { size: '6x10', amount: 305 },
      { size: '6x12', amount: 315 },
      { size: '6x18', amount: 325 },
      { size: '6x20', amount: 335 },
      { size: '8x8', amount: 345 },
      { size: '8x10', amount: 355 },
      { size: '8x12', amount: 365 },
      { size: '8x13', amount: 375 },
      { size: '8x16', amount: 385 },
      { size: '8x20', amount: 395 },
      { size: '8x24', amount: 405 },
      { size: '10x10', amount: 415 },
      { size: '10x12', amount: 425 },
      { size: '10x12 (with Mount)', amount: 435 },
      { size: '10x15', amount: 445 },
      { size: '10x18', amount: 455 },
      { size: '10x20', amount: 465 },
      { size: '10x24', amount: 475 },
      { size: '12x12', amount: 485 },
      { size: '12x15', amount: 495 },
      { size: '12x16', amount: 505 },
      { size: '12x18', amount: 515 },
      { size: '12x20', amount: 525 },
      { size: '12x24', amount: 535 },
      { size: '16x20', amount: 545 },
      { size: '16x24', amount: 555 },
      { size: '20x24', amount: 565 },
      { size: '20x30', amount: 575 },
      { size: '24x36', amount: 585 },
    ],
  },
  frameMaterialAmounts: {
    glass: 400,
    fiber: 350,
    wood: 300,
    metal: 450,
    plastic: 250,
    aluminum: 500,
    synthetic: 2800,
  },
  fSizeAmounts: {
    F1: 100,
    F2: 150,
    F3: 200,
    F4: 250,
    F5: 300,
    F6: 350,
    F7: 400,
  },
  materialCosts: [
    { id: 2, name: 'ppr', amount: 100 },
    { id: 3, name: 'sad', amount: 0 },
    { id: 4, name: 'zzz', amount: 223 },
  ],
  inventoryItems: [],
};


// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  // Admin user
  const existing = await User.findOne({ email: ADMIN.email })
  if (existing) {
    console.log(`⚠️  Admin user already exists: ${ADMIN.email}`)
  } else {
    const hashed = await bcrypt.hash(ADMIN.password, 10)
    await User.create({ ...ADMIN, password: hashed })
    console.log(`✅ Admin created — email: ${ADMIN.email}  password: ${ADMIN.password}`)
  }

  // Studio info (single document — upsert)
  await StudioInfo.findOneAndUpdate({}, STUDIO, { upsert: true, new: true })
  console.log('✅ Studio info saved')

  // Billing info (single document — upsert)
  const existingBilling = await Billing.findOne({});
  if (!existingBilling) {
    await Billing.create(INITIAL_BILLING);
    console.log('✅ Initial billing settings seeded');
  } else {
    console.log('⚠️  Billing settings already exist');
  }

  await mongoose.disconnect()
  console.log('🔌 Done')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
