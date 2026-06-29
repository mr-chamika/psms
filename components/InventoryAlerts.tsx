import { AlertTriangle, Package } from 'lucide-react';

interface InventoryItem {
    id: string;
    name: string;
    current: number;
    threshold: number;
    unit: string;
}

const lowStockItems: InventoryItem[] = [
    { id: '1', name: 'Photo Paper (Glossy A4)', current: 15, threshold: 50, unit: 'sheets' },
    { id: '2', name: 'Ink Cartridge Black', current: 2, threshold: 5, unit: 'units' },
    { id: '3', name: 'Album Covers (Large)', current: 8, threshold: 20, unit: 'pcs' },
    { id: '4', name: 'Mounting Boards', current: 12, threshold: 30, unit: 'pcs' },
];

export function InventoryAlerts() {
    const getStockPercentage = (current: number, threshold: number) => {
        return Math.min((current / threshold) * 100, 100);
    };

    const getStockBarColor = (percentage: number) => {
        if (percentage < 25) return 'bg-red-400';
        if (percentage < 50) return 'bg-amber-400';
        return 'bg-green-500';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-2xs animate-slide-up" style={{ animationDelay: '500ms' }}>
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Low Stock Alerts</h3>
                    <p className="text-sm text-gray-500">{lowStockItems.length} items need attention</p>
                </div>
            </div>
            <div className="space-y-4">
                {lowStockItems.map((item) => {
                    const percentage = getStockPercentage(item.current, item.threshold);
                    return (
                        <div key={item.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
                                        <Package className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {item.current} / {item.threshold} {item.unit}
                                </span>
                            </div>
                            {/* Custom progress bar for stock percentage */}
                            <div className={`relative h-2 w-full rounded bg-gray-200`}>
                                <div
                                    className={`absolute left-0 top-0 h-2 rounded ${getStockBarColor(percentage)}`}
                                    style={{ width: `${percentage}%`, transition: 'width 0.3s' }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <button className="mt-5 w-full rounded-lg bg-white border border-gray-200 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors hover:bg-gray-100">
                Order Supplies
            </button>
        </div>
    );
}
