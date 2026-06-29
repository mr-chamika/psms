export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled'

export const normalizeTaskStatus = (value?: string | null) => (value || '').toLowerCase().trim()

export const computeAutoStatus = (options: {
    itemType: string
    existingStatus?: string | null
    photographerStatus?: string | null
    editorStatus?: string | null
    hasPhotographer: boolean
    hasEditor: boolean
}): TaskStatus | undefined => {
    const existing = normalizeTaskStatus(options.existingStatus) as TaskStatus
    if (existing === 'cancelled') return 'cancelled'

    const p = normalizeTaskStatus(options.photographerStatus)
    const e = normalizeTaskStatus(options.editorStatus)

    if (options.itemType === 'sittings') {
        if (options.hasPhotographer && !options.hasEditor) {
            if (p === 'completed') return 'completed'
            if (p === 'in-progress') return 'in-progress'
            if (p === 'pending') return 'pending'
        } else if (options.hasPhotographer && options.hasEditor) {
            if (e === 'completed') return 'completed'
            if (e === 'in-progress' || p === 'in-progress' || p === 'completed') return 'in-progress'
            if (p === 'pending' && e === 'pending') return 'pending'
        } else if (!options.hasPhotographer && options.hasEditor) {
            if (e === 'completed') return 'completed'
            if (e === 'in-progress') return 'in-progress'
            if (e === 'pending') return 'pending'
        }
        return existing || undefined
    }

    if (options.itemType === 'media' || options.itemType === 'extra-copies') {
        if (!options.hasEditor) return existing || undefined
        if (e === 'completed') return 'completed'
        if (e === 'in-progress') return 'in-progress'
        if (e === 'pending') return 'pending'
        return existing || undefined
    }

    return existing || undefined
}

export function computeSittingItemStatus(sitting: {
    status?: string | null
    photographerStatus?: string | null
    editorStatus?: string | null
    photographer?: unknown
    editor?: unknown
}): TaskStatus | undefined {
    const hasAssignment = (value: unknown) => Boolean(value && String(value).trim())

    return computeAutoStatus({
        itemType: 'sittings',
        existingStatus: sitting.status,
        photographerStatus: sitting.photographerStatus,
        editorStatus: sitting.editorStatus,
        hasPhotographer: hasAssignment(sitting.photographer),
        hasEditor: hasAssignment(sitting.editor),
    })
}
