"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { Eye, Pencil, Trash2, Upload } from "lucide-react";
import {
  LIST_ACTION_BTN,
  LIST_ACTION_ICON,
  LIST_ACTIONS_WRAP,
} from "@/lib/list-page-styles";
import { cn } from "@/lib/utils";

type ActionProps = {
  title: string;
  "aria-label"?: string;
};

export function ListTableActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(LIST_ACTIONS_WRAP, className)}>
      {children}
    </div>
  );
}

export function ListViewAction({
  title,
  "aria-label": ariaLabel,
  onClick,
}: ActionProps & { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={LIST_ACTION_BTN}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      <Eye className={LIST_ACTION_ICON} />
    </button>
  );
}

export function ListViewActionLink({
  title,
  "aria-label": ariaLabel,
  href,
}: ActionProps & { href: string }) {
  return (
    <Link href={href} className={LIST_ACTION_BTN} title={title} aria-label={ariaLabel ?? title}>
      <Eye className={LIST_ACTION_ICON} />
    </Link>
  );
}

export function ListEditAction({
  title,
  "aria-label": ariaLabel,
  onClick,
}: ActionProps & { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={LIST_ACTION_BTN}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      <Pencil className={LIST_ACTION_ICON} />
    </button>
  );
}

export function ListDeleteAction({
  title,
  "aria-label": ariaLabel,
  onClick,
}: ActionProps & { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={LIST_ACTION_BTN}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      <Trash2 className={LIST_ACTION_ICON} />
    </button>
  );
}

export function ListUploadAction({
  title,
  "aria-label": ariaLabel,
  onClick,
}: ActionProps & { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={LIST_ACTION_BTN}
      title={title}
      aria-label={ariaLabel ?? title}
    >
      <Upload className={LIST_ACTION_ICON} />
    </button>
  );
}

export function ListUploadActionLink({
  title,
  "aria-label": ariaLabel,
  href,
}: ActionProps & { href: string }) {
  return (
    <Link href={href} className={LIST_ACTION_BTN} title={title} aria-label={ariaLabel ?? title}>
      <Upload className={LIST_ACTION_ICON} />
    </Link>
  );
}
