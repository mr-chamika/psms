"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    Camera,
    Tag,
    Wand2,
    Printer,
    BookImage,
    Video,
    Package,
    Aperture,
    Receipt,
    BarChart3,
    Users,
    Settings,
    CalendarPlus,
    ClipboardList,
    CreditCard,
    Truck,
    Upload,
    ListTodo,
    ImagePlus,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    BookUser,
} from "lucide-react";

// // Role selection for demo. Replace with real user role logic.
// const role = "admin"; // Change to 'receptionist', 'photographer', or 'editor' to test

import { LucideIcon } from "lucide-react";

type NavItem = {
    title: string;
    href: string;
    icon?: LucideIcon;
    roles: string[];
};

const navItems: NavItem[] = [

    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['admin'] },
    // { title: 'Sittings Management', href: '/admin/sittings', icon: Camera, roles: ['admin'] },
    // { title: 'Services & Pricing', href: '/admin/services', icon: Tag, roles: ['admin'] },
    // { title: 'Editing Management', href: '/admin/editing', icon: Wand2, roles: ['admin'] },
    { title: 'Orders', href: '/admin/orders', icon: Printer, roles: ['admin'] },
    { title: 'Media Source Links', href: '/admin/media-source-links', icon: Upload, roles: ['admin'] },
    // { title: 'Frames', href: '/admin/frames', icon: BookImage, roles: ['admin'] },
    // { title: 'Videography & Events', href: '/admin/videography', icon: Video, roles: ['admin'] },
    // { title: 'Inventory Management', href: '/admin/inventory', icon: Package, roles: ['admin'] },
    // { title: 'Equipment Renting', href: '/admin/equipment', icon: Aperture, roles: ['admin'] },
    { title: 'Sitting Management', href: '/admin/sitting-management', icon: CalendarDays, roles: ['admin'] },
    { title: 'Client Management', href: '/admin/client-management', icon: BookUser, roles: ['admin'] },
    { title: 'User & Role Management', href: '/admin/user-management', icon: Users, roles: ['admin'] },
    { title: 'Billing & Invoices', href: '/admin/billing', icon: Receipt, roles: ['admin'] },
    { title: 'Reports & Analytics', href: '/admin/reports', icon: BarChart3, roles: ['admin'] },
    { title: 'System Settings', href: '/admin/settings', icon: Settings, roles: ['admin'] },


    { title: 'Dashboard', href: '/receptionist', icon: LayoutDashboard, roles: ['receptionist'] },
    { title: 'Orders', href: '/receptionist/orders', icon: CalendarPlus, roles: ['receptionist'] },
    { title: 'Sitting Management', href: '/receptionist/sitting-management', icon: CalendarDays, roles: ['receptionist'] },
    { title: 'Client Management', href: '/receptionist/client-management', icon: BookUser, roles: ['receptionist'] },
    { title: 'Media Source Links', href: '/receptionist/media-source-links', icon: Upload, roles: ['receptionist'] },

    { title: 'Dashboard', href: '/photographer', icon: LayoutDashboard, roles: ['photographer'] },
    { title: 'My Sittings', href: '/photographer/my-sittings', icon: Camera, roles: ['photographer'] },
    //{ title: 'Upload Raw Photos', href: '/photographer/upload-photos', icon: Upload, roles: ['photographer'] },
    //{ title: 'Equipment Availability', href: '/photographer/equipment-status', icon: Aperture, roles: ['photographer'] },

    { title: 'Dashboard', href: '/editor', icon: LayoutDashboard, roles: ['editor'] },
    { title: 'Editing Queue', href: '/editor/editing-queue', icon: ListTodo, roles: ['editor'] },
    { title: 'Upload Edited Media', href: '/editor/upload-edited-media', icon: ImagePlus, roles: ['editor'] },
    // {
    //   title: "Equipment Availability",
    //   href: "/editor/equipment-availability",
    //   icon: Aperture,
    //   roles: ["editor"],
    // },
];

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const pathname = usePathname();
    const [studioName, setStudioName] = useState('PhotoStudio');

    let role = "admin"; // Default role
    if (pathname.startsWith("/editor")) {
        role = "editor";
    } else if (pathname.startsWith("/photographer")) {
        role = "photographer";
    } else if (pathname.startsWith("/receptionist")) {
        role = "receptionist";
    } else if (pathname.startsWith("/admin")) {
        role = "admin";
    }

    // Filter nav items by role
    const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

    useEffect(() => {
        fetch('/api/settings/studio')
            .then(res => res.json())
            .then(data => { if (data.studioName) setStudioName(data.studioName); })
            .catch(() => { });

        const handler = (e: Event) => {
            const name = (e as CustomEvent<string>).detail;
            if (name) setStudioName(name);
        };
        window.addEventListener('studio-name-changed', handler);
        return () => window.removeEventListener('studio-name-changed', handler);
    }, []);

    return (
        <aside
            style={{
                '--sidebar-background': '222 47% 11%',
                '--sidebar-foreground': '220 14% 96%',
                '--sidebar-primary': '263 70% 50%',
                '--sidebar-primary-foreground': '0 0% 100%',
                '--sidebar-accent': '222 47% 18%',
                '--sidebar-accent-foreground': '220 14% 96%',
                '--sidebar-border': '222 47% 18%',
                '--sidebar-ring': '263 70% 50%',
                '--sidebar-muted': '220 9% 60%',
            } as React.CSSProperties}
            className={`fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 border-r bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-[hsl(var(--sidebar-border))] ${collapsed ? 'w-18' : 'w-64'}`}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent shrink-0">
                    <Camera className="h-5 w-5 text-accent-foreground" />
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-semibold text-sidebar-foreground truncate">
                            {studioName}
                        </h1>
                        <p className="text-xs text-sidebar-muted">Management System</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                <ul className="space-y-1">
                    {filteredNavItems.map((item) => {
                        let isActive;
                        if (
                            item.href === '/admin' ||
                            item.href === '/receptionist' ||
                            item.href === '/photographer' ||
                            item.href === '/editor'
                        ) {
                            isActive = pathname === item.href;
                        } else {
                            isActive = pathname.startsWith(item.href) && pathname !== '/admin';
                        }
                        const IconComponent = item.icon;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[hsl(var(--sidebar-foreground))] opacity-70 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] ${isActive ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] shadow-[inset_3px_0_0_hsl(var(--sidebar-primary))] opacity-100' : ''}`}
                                    title={collapsed ? item.title : undefined}
                                >
                                    {IconComponent && (
                                        <IconComponent className="h-5 w-5 shrink-0" />
                                    )}
                                    {!collapsed && (
                                        <span className="text-sm font-medium truncate">
                                            {item.title}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Collapse Button */}
            <div className="border-t border-sidebar-border p-3">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="sidebar-item w-full cursor-pointer justify-center flex items-center gap-2"
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