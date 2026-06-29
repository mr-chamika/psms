export function PriorityBadge({ priority }: { priority?: string }) {
    const key = (priority || "normal").toLowerCase();
    const variants: Record<string, { text: string; bg: string; border: string }> = {
        urgent: { text: "#b91c1c", bg: "#fee2e2", border: "#fecaca" },
        high: { text: "#b45309", bg: "#fef3c7", border: "#fde68a" },
        normal: { text: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
        low: { text: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
    };
    const style = variants[key] || variants.normal;

    return (
        <span
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize"
            style={{ color: style.text, background: style.bg, borderColor: style.border }}
        >
            {key}
        </span>
    );
}
