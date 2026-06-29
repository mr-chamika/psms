export function downloadCSV(rows: Record<string, unknown>[], filename: string): void {
    if (!rows || rows.length === 0) {
        return
    }

    const headers = Object.keys(rows[0])
    const lines = [
        headers.map((header) => JSON.stringify(header)).join(','),
        ...rows.map((row) =>
            headers
                .map((header) => {
                    const value = row[header]
                    return JSON.stringify(value ?? '')
                })
                .join(',')
        ),
    ]

    const csvContent = lines.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    URL.revokeObjectURL(url)
}
