"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, Loader2, Save } from "lucide-react";
import Modal from "@/components/Modal";
import { LIST_FORM_ACTIONS, LIST_MODAL_CLOSE_BTN, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_SECONDARY } from "@/lib/list-page-styles";
import { openExternalLink } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type MediaSourceLinkModalProps = {
  open: boolean;
  itemId: string | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

type ItemMeta = {
  itemId: string;
  orderId: string;
  orderName: string;
  item: string;
};

export function MediaSourceLinkModal({
  open,
  itemId,
  onOpenChange,
  onSaved,
}: MediaSourceLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalSourceLink, setModalSourceLink] = useState("");
  const [initialSourceLink, setInitialSourceLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [modalError, setModalError] = useState("");
  const [meta, setMeta] = useState<ItemMeta | null>(null);

  useEffect(() => {
    if (!open || !itemId) {
      setModalSourceLink("");
      setInitialSourceLink("");
      setMeta(null);
      setModalError("");
      setCopied(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setModalError("");
      try {
        const { data } = await axios.get(`/api/media-source-links/${encodeURIComponent(itemId)}`);
        if (cancelled) return;
        const loadedLink = typeof data.sourceLink === "string" ? data.sourceLink : "";
        setModalSourceLink(loadedLink);
        setInitialSourceLink(loadedLink);
        setMeta({
          itemId: data.itemId || itemId,
          orderId: data.orderId || "",
          orderName: data.orderName || "",
          item: data.item || "Media item",
        });
      } catch {
        if (!cancelled) {
          setModalError("Failed to load media item details");
          setMeta(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, itemId]);

  const handleClose = () => {
    if (saving) return;
    onOpenChange(false);
  };

  const handleCopy = async () => {
    if (!modalSourceLink.trim()) return;
    await navigator.clipboard.writeText(modalSourceLink.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDirty = modalSourceLink.trim() !== initialSourceLink.trim();

  const handleSave = async () => {
    if (!itemId) return;
    if (!modalSourceLink.trim()) {
      setModalError("Please enter a valid source link");
      return;
    }

    try {
      setSaving(true);
      setModalError("");
      await axios.post(`/api/media-source-links/${encodeURIComponent(itemId)}`, {
        sourceLink: modalSourceLink.trim(),
      });
      toast.success("Source link saved successfully.");
      onSaved?.();
      onOpenChange(false);
    } catch {
      setModalError("Failed to save the source link. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      show={open}
      setShow={(value) => {
        if (!value) handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-auto">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Source Link</h2>
            <p className="mt-1 text-sm text-gray-500">Add or update the media source link.</p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={LIST_MODAL_CLOSE_BTN}
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="space-y-4 px-6 py-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {modalError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {modalError}
                </div>
              ) : null}

              {meta ? (
                <div className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-700">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-gray-500">Item ID</span>
                    <span className="font-mono font-medium text-gray-900">{meta.itemId}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-gray-500">Order</span>
                    <span className="font-mono">{meta.orderId || "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-gray-500">Client</span>
                    <span>{meta.orderName || "Unknown"}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <span className="text-gray-500">Media</span>
                    <span>{meta.item}</span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                  Source Link
                </label>
                <Input
                  value={modalSourceLink}
                  onChange={(e) => setModalSourceLink(e.target.value)}
                  placeholder="https://..."
                  className="h-11 font-mono text-sm text-gray-700 bg-gray-50 border-gray-200"
                />

                <div className={`${LIST_FORM_ACTIONS} mt-4`}>
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!modalSourceLink.trim()}
                    className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openExternalLink(modalSourceLink)}
                    disabled={!modalSourceLink.trim()}
                    className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !isDirty || !modalSourceLink.trim()}
                    className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-4 w-4" aria-hidden />
                    )}
                    Save Source Link
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
