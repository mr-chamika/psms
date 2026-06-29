"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Camera, Headset, PenTool, Plus, Shield, Users } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

import { UserListCard } from "@/components/user-list-card";
import type { UserListItem, UserRole } from "@/components/user-card";
import UserUpdateForm from "@/components/user-update-form";
import DeleteUserModal from "@/components/delete-user-modal";
import UserDetailsModal from "@/components/user-details-modal";
import PageHeader from "@/components/page-header";
import { PAGE_CONTENT, LIST_PAGE_HEADER_ACTION } from "@/lib/list-page-styles";

type ApiUser = {
  _id?: string;
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: string | null;
  phoneNumber?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toLowerCase();
  if (
    normalized === "admin" ||
    normalized === "receptionist" ||
    normalized === "editor" ||
    normalized === "photographer"
  ) {
    return normalized;
  }
  return null;
}

function normalizeUser(user: ApiUser, index: number): UserListItem {
  return {
    id: String(user._id ?? user.id ?? index),
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    email: user.email ?? null,
    role: normalizeRole(user.role),
    phoneNumber: user.phoneNumber ?? null,
    createdAt: user.createdAt ?? null,
    updatedAt: user.updatedAt ?? null,
  };
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null);
  const [viewingUser, setViewingUser] = useState<UserListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get<ApiUser[]>("/api/users");
        const data = res.data;
        if (!cancelled) {
          setUsers((data ?? []).map(normalizeUser));
        }
      } catch (e) {
        if (!cancelled) {
          setUsers([]);
          if (axios.isAxiosError(e)) {
            const status = e.response?.status;
            const message = status === 403 ? "You don't have permission to view users." : "Failed to load users.";
            setError(message);
          } else {
            setError(e instanceof Error ? e.message : "Failed to load users.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();
    return () => {
      cancelled = true;
    };
  }, []);

  const usersByRole = useMemo(() => {
    const grouped: Record<UserRole, UserListItem[]> = {
      admin: [],
      receptionist: [],
      editor: [],
      photographer: [],
    };

    for (const user of users) {
      const role = user.role;
      if (!role) continue;
      const bucket = grouped[role];
      if (!bucket) continue;
      bucket.push(user);
    }

    return grouped;
  }, [users]);

  return (
    <div className={PAGE_CONTENT}>
      {/* Header (matches Figma, but uses existing project accent colors) */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-2xs">
        <PageHeader
          title="User Management"
          icon={Users}
          subtitle="Manage staff accounts, roles, and access permissions."
        />

        <Link
          href="/signup"
          className={`${LIST_PAGE_HEADER_ACTION} appearance-none`}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Create User
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-2xs">
          Loading users...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <UserListCard
            role="admin"
            icon={Shield}
            users={usersByRole.admin}
            onViewUserAction={(u) => setViewingUser(u)}
            onEditUserAction={(u) => setEditingUser(u)}
            onDeleteUserAction={(u) => setDeletingUser(u)}
          />
          <UserListCard
            role="receptionist"
            icon={Headset}
            users={usersByRole.receptionist}
            onViewUserAction={(u) => setViewingUser(u)}
            onEditUserAction={(u) => setEditingUser(u)}
            onDeleteUserAction={(u) => setDeletingUser(u)}
          />
          <UserListCard
            role="editor"
            icon={PenTool}
            users={usersByRole.editor}
            onViewUserAction={(u) => setViewingUser(u)}
            onEditUserAction={(u) => setEditingUser(u)}
            onDeleteUserAction={(u) => setDeletingUser(u)}
          />
          <UserListCard
            role="photographer"
            icon={Camera}
            users={usersByRole.photographer}
            onViewUserAction={(u) => setViewingUser(u)}
            onEditUserAction={(u) => setEditingUser(u)}
            onDeleteUserAction={(u) => setDeletingUser(u)}
          />
        </div>
      )}

      <UserDetailsModal
        show={!!viewingUser}
        user={viewingUser}
        onCloseAction={() => setViewingUser(null)}
      />

      {editingUser && (
        <UserUpdateForm
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={(updated) => {
            setUsers((prev) =>
              prev.map((u) => (u.id === updated.id ? updated : u))
            );
            setEditingUser(null);
          }}
        />
      )}

      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {deleteError}
        </div>
      )}

      <DeleteUserModal
        show={!!deletingUser}
        userName={
          deletingUser
            ? `${deletingUser.firstName ?? ''} ${deletingUser.lastName ?? ''}`.trim() ||
              deletingUser.email ||
              undefined
            : undefined
        }
        onCancelAction={() => {
          setDeletingUser(null);
          setDeleteError(null);
        }}
        onConfirmAction={async () => {
          if (!deletingUser) return;
          setDeleteError(null);
          try {
            await axios.delete(`/api/users/${deletingUser.id}`);
            toast.success('User deleted successfully.');
            setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
            setDeletingUser(null);
          } catch (e) {
            const msg = axios.isAxiosError(e)
              ? (e.response?.data as { message?: string })?.message ?? 'Failed to delete user.'
              : 'Failed to delete user.';
            setDeleteError(msg);
            setDeletingUser(null);
          }
        }}
      />
    </div>
  );
}