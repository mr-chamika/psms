"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";

import { UserCard, type UserListItem, type UserRole } from "@/components/user-card";

type RoleStyle = {
  label: string;
  headerIconBg: string;
  headerIconText: string;
  avatarBg: string;
};

export const roleStyles: Record<UserRole, RoleStyle> = {
  admin: {
    label: "Admin",
    headerIconBg: "bg-purple-50",
    headerIconText: "text-purple-700",
    avatarBg: "bg-purple-600",
  },
  receptionist: {
    label: "Receptionist",
    headerIconBg: "bg-green-50",
    headerIconText: "text-green-700",
    avatarBg: "bg-green-600",
  },
  editor: {
    label: "Editor",
    headerIconBg: "bg-amber-50",
    headerIconText: "text-amber-700",
    avatarBg: "bg-amber-600",
  },
  photographer: {
    label: "Photographer",
    headerIconBg: "bg-blue-50",
    headerIconText: "text-blue-700",
    avatarBg: "bg-blue-600",
  },
};

type UserListCardProps = {
  role: UserRole;
  icon: LucideIcon;
  users: UserListItem[];
  onViewUserAction?: (user: UserListItem) => void;
  onEditUserAction?: (user: UserListItem) => void;
  onDeleteUserAction?: (user: UserListItem) => void;
};

export function UserListCard({ role, icon: Icon, users, onViewUserAction, onEditUserAction, onDeleteUserAction }: UserListCardProps) {
  const styles = roleStyles[role];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-2xs">
      <header className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles.headerIconBg}`}>
          <Icon className={`h-4 w-4 ${styles.headerIconText}`} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{styles.label}</h3>
          <p className="text-xs text-gray-500">{users.length} users</p>
        </div>
      </header>

      <div className="space-y-3 p-4">
        {users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
            <p className="text-sm font-medium text-gray-700">No users</p>
            <p className="mt-1 text-xs text-gray-500">Create a user to assign this role.</p>
          </div>
        ) : (
          users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              avatarClassName={styles.avatarBg}
              onViewAction={onViewUserAction}
              onEditAction={onEditUserAction}
              onDeleteAction={onDeleteUserAction}
            />
          ))
        )}
      </div>
    </section>
  );
}
