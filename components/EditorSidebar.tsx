// components/editor/EditorSidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Camera,
    LayoutDashboard,
    ListTodo,
    ImagePlus,
    Aperture,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const navItems = [
    { title: 'Dashboard',           href: '/editor',                      icon: LayoutDashboard },
    { title: 'Editing Queue',        href: '/editor/editing-queue',        icon: ListTodo        },
    { title: 'Upload Edited Media',  href: '/editor/upload-edited',        icon: ImagePlus       },
    { title: 'Equipment Availability', href: '/editor/equipment-availability', icon: Aperture    },
];

export function EditorSidebar({
    collapsed,
    setCollapsed,
}: {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
}) {
    const pathname = usePathname();

    return (
        <aside
            style={{
                '--sidebar-background': '222 47% 11%',
                '--sidebar-foreground': '220 14% 96%',
                '--sidebar-primary':    '263 70% 50%',
                '--sidebar-accent':     '222 47% 18%',
                '--sidebar-border':     '222 47% 18%',
                '--sidebar-muted':      '220 9% 60%',
            } as React.CSSProperties}
            className={`fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 border-r
                bg-[hsl(var(--sidebar-background))]
                text-[hsl(var(--sidebar-foreground))]
                border-[hsl(var(--sidebar-border))]
                ${collapsed ? 'w-18' : 'w-64'}`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-accent))] shrink-0">
                    <Camera className="h-5 w-5 text-[hsl(var(--sidebar-foreground))]" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-semibold text-[hsl(var(--sidebar-foreground))] truncate">
                            PhotoStudio
                        </h1>
                        <p className="text-xs text-[hsl(var(--sidebar-muted))]">Management System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.href === '/editor'
                            ? pathname === item.href
                            : pathname.startsWith(item.href);
                        const Icon = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    title={collapsed ? item.title : undefined}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                        text-[hsl(var(--sidebar-foreground))]
                                        hover:opacity-100
                                        hover:bg-[hsl(var(--sidebar-accent))]
                                        ${isActive
                                            ? 'bg-[hsl(var(--sidebar-accent))] opacity-100 shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))]'
                                            : 'opacity-70'
                                        }`}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    {!collapsed && (
                                        <span className="text-sm font-medium truncate">{item.title}</span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Collapse Button */}
            <div className="border-t border-[hsl(var(--sidebar-border))] p-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center gap-2 justify-center px-3 py-2.5 rounded-lg
                        text-[hsl(var(--sidebar-foreground))] opacity-70
                        hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]
                        transition-all duration-200 cursor-pointer"
                >
                    {collapsed ? (
                        <ChevronRight className="h-5 w-5" />
                    ) : (
                        <>
                            <ChevronLeft className="h-5 w-5" />
                            <span className="text-sm font-medium">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}