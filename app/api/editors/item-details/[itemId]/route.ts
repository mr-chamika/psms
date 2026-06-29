import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Sitting } from '@/lib/models/Sitting'
import { Media } from '@/lib/models/Media'
import { ExtraCopy } from '@/lib/models/ExtraCopy'
import { requireAuth } from '@/lib/rbac/serverGuard'

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
    await connectDB()
    const { itemId } = await params;
    
    let item: any = null;

    if (itemId.startsWith('SIT-')) {
        item = await Sitting.findOne({ sittingId: itemId });
    } else if (itemId.startsWith('MED-')) {
        item = await Media.findOne({ mediaId: itemId });
    } else if (itemId.startsWith('EXC-')) {
        item = await ExtraCopy.findOne({ extraCopyId: itemId });
    } else {
        // Try precise match by ID if not prefixed properly
        item = (await Sitting.findById(itemId)) || (await Media.findById(itemId)) || (await ExtraCopy.findById(itemId));
    }
    
    if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    let resolvedSourceLink = item.sourceLink || ''
    let originalSourceLink = ''
    let originalEditedLink = ''
    let originalItemId = ''
    let originalItemType: 'sitting' | 'media' | '' = ''
    let originalPhotographerStatus: string | null = null
    let originalEditorStatus: string | null = null

    if (item.extraCopyId && item.originalNumber) {
        originalItemId = item.originalNumber
        const originalSitting = await Sitting.findOne({ sittingId: item.originalNumber }).lean()
        if (originalSitting) {
            originalItemType = 'sitting'
            originalSourceLink = originalSitting.sourceLink || ''
            originalEditedLink = originalSitting.editedLink || ''
            originalPhotographerStatus = originalSitting.photographerStatus || null
            originalEditorStatus = originalSitting.editorStatus || null
            resolvedSourceLink = originalSourceLink || resolvedSourceLink
        } else {
            const originalMedia = await Media.findOne({ mediaId: item.originalNumber }).lean()
            if (originalMedia) {
                originalItemType = 'media'
                originalSourceLink = originalMedia.sourceLink || ''
                originalEditedLink = originalMedia.editedLink || ''
                originalEditorStatus = originalMedia.editorStatus || null
                resolvedSourceLink = originalSourceLink || resolvedSourceLink
            }
        }
    }

    return NextResponse.json({
        id: itemId,
        sourceLink: resolvedSourceLink,
        editedLink: item.editedLink || '',
        status: item.status,
        photographer: item.photographer || null,
        photographerStatus: item.photographerStatus || null,
        editorStatus: item.editorStatus || null,
        isExtraCopy: Boolean(item.extraCopyId),
        originalItemId,
        originalItemType,
        originalSourceLink,
        originalEditedLink,
        originalPhotographerStatus,
        originalEditorStatus,
    });
}
