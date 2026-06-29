import { connectDB } from '../lib/db'
import { Sitting } from '../lib/models/Sitting'
import { Media } from '../lib/models/Media'
import { ExtraCopy } from '../lib/models/ExtraCopy'
import { Framing } from '../lib/models/Framing'
import { Counter } from '../lib/models/Counter'

async function migrateUniqueIds() {
    await connectDB()
    console.log('Connected to database')

    // Migrate Sittings
    const sittingsWithoutId = await Sitting.find({ sittingId: { $exists: false } })
    console.log(`Found ${sittingsWithoutId.length} sittings without IDs`)

    for (const sitting of sittingsWithoutId) {
        const counter = await Counter.findByIdAndUpdate(
            'sittingId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        sitting.sittingId = `SIT-${String(counter.seq).padStart(4, '0')}`
        await sitting.save()
        console.log(`Updated sitting: ${sitting.sittingId}`)
    }

    // Migrate Media
    const mediaWithoutId = await Media.find({ mediaId: { $exists: false } })
    console.log(`Found ${mediaWithoutId.length} media without IDs`)

    for (const media of mediaWithoutId) {
        const counter = await Counter.findByIdAndUpdate(
            'mediaId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        media.mediaId = `MED-${String(counter.seq).padStart(4, '0')}`
        await media.save()
        console.log(`Updated media: ${media.mediaId}`)
    }

    // Migrate Extra Copies
    const extraCopiesWithoutId = await ExtraCopy.find({ extraCopyId: { $exists: false } })
    console.log(`Found ${extraCopiesWithoutId.length} extra copies without IDs`)

    for (const extraCopy of extraCopiesWithoutId) {
        const counter = await Counter.findByIdAndUpdate(
            'extraCopyId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        extraCopy.extraCopyId = `EXC-${String(counter.seq).padStart(4, '0')}`
        await extraCopy.save()
        console.log(`Updated extra copy: ${extraCopy.extraCopyId}`)
    }

    // Migrate Framings
    const framingsWithoutId = await Framing.find({ framingId: { $exists: false } })
    console.log(`Found ${framingsWithoutId.length} framings without IDs`)

    for (const framing of framingsWithoutId) {
        const counter = await Counter.findByIdAndUpdate(
            'framingId',
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        )
        framing.framingId = `FRM-${String(counter.seq).padStart(4, '0')}`
        await framing.save()
        console.log(`Updated framing: ${framing.framingId}`)
    }

    console.log('Migration completed!')
    process.exit(0)
}

migrateUniqueIds().catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
})
