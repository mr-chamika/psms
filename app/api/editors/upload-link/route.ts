import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { requireAuth } from '@/lib/rbac/serverGuard'

export async function POST(req: Request) {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response

    try {
        await connectDB()
        const { itemId, editedLink } = await req.json()
        
        if (!itemId || !editedLink) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        let Model: any = null;
        let query: any = {};

        // Determine Model based on prefix
        if (itemId.startsWith('SIT-')) {
            Model = Sitting;
            query = { sittingId: itemId };
        } else if (itemId.startsWith('MED-')) {
            Model = Media;
            query = { mediaId: itemId };
        } else if (itemId.startsWith('EXC-')) {
            Model = ExtraCopy;
            query = { extraCopyId: itemId };
        } else {
            // Fallback: try to find by _id in likely collections
            const s = await Sitting.findById(itemId);
            if (s) { Model = Sitting; query = { _id: itemId }; }
            else {
                const m = await Media.findById(itemId);
                if (m) { Model = Media; query = { _id: itemId }; }
                else {
                    const e = await ExtraCopy.findById(itemId);
                    if (e) { Model = ExtraCopy; query = { _id: itemId }; }
                }
            }
        }

        if (!Model) {
             return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }
        
        // Update the item
        // We set status to 'completed' as submitting the edited link usually signifies completion of the editing task
        const updatedItem = await Model.findOneAndUpdate(
            query,
            { 
                $set: { 
                    editedLink,
                    status: 'completed',
                    updatedAt: new Date()
                } 
            },
            { new: true }
        );

        if (!updatedItem) {
            return NextResponse.json({ error: 'Item not found in database' }, { status: 404 })
        }

        return NextResponse.json({ success: true, item: updatedItem })

    } catch (error) {
        console.error('Error uploading link:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
