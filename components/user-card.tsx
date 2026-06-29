"use client";

import React from "react";
import {
  ListDeleteAction,
  ListEditAction,
  ListTableActions,
} from "@/components/list-table-actions";

export type UserRole = "admin" | "receptionist" | "editor" | "photographer";

export type UserListItem = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  role?: UserRole | null;
  phoneNumber?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type UserCardProps = {
  user: UserListItem;
  avatarClassName: string;
  onViewAction?: (user: UserListItem) => void;
  onEditAction?: (user: UserListItem) => void;
  onDeleteAction?: (user: UserListItem) => void;
};

function getInitials(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const fn = (firstName ?? "").trim();
  const ln = (lastName ?? "").trim();
  if (fn || ln) {
    return `${fn.charAt(0) || ""}${ln.charAt(0) || ""}`.toUpperCase() || "U";
  }
  const fallback = (email ?? "").trim();
  if (!fallback) return "U";
  return fallback.slice(0, 2).toUpperCase();
}

function getDisplayName(firstName?: string | null, lastName?: string | null, email?: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || email || "User";
}

export function UserCard({ user, avatarClassName, onViewAction, onEditAction, onDeleteAction }: UserCardProps) {
  const name = getDisplayName(user.firstName, user.lastName, user.email);
  const initials = getInitials(user.firstName, user.lastName, user.email);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewAction?.(user)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onViewAction?.(user);
        }
      }}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition cursor-pointer hover:border-blue-200 hover:bg-blue-50/30"
      aria-label={`View details for ${name}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarClassName}`}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{name}</p>
          <p className="truncate text-xs text-gray-500">{user.email || ""}</p>
        </div>
      </div>

      <ListTableActions className="shrink-0">
        <ListEditAction
          title="Edit user"
          aria-label={`Edit ${name}`}
          onClick={(event) => {
            event.stopPropagation();
            onEditAction?.(user);
          }}
        />
        <ListDeleteAction
          title="Delete user"
          aria-label={`Delete ${name}`}
          onClick={(event) => {
            event.stopPropagation();
            onDeleteAction?.(user);
          }}
        />
      </ListTableActions>
    </div>
  );
}
