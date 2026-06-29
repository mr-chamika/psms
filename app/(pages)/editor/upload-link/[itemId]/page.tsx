"use client";

import { useState, useEffect } from "react";
import {
  LIST_FORM_ACTIONS,
  LIST_PAGE_HEADER,
  LIST_PAGE_HEADER_ACTION,
  LIST_PAGE_HEADER_SECONDARY,
  LIST_TABLE_WRAPPER,
  PAGE_CONTENT,
} from "@/lib/list-page-styles";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/page-header";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Eye,
  Upload,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { openExternalLink } from "@/lib/utils";

export default function UploadEditedLinkPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const itemId = params.itemId as string;
  const orderId = searchParams.get("orderId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data state
  const [sourceLink, setSourceLink] = useState("");
  const [editedLink, setEditedLink] = useState("");
  const [initialEditedLink, setInitialEditedLink] = useState("");
  const [itemType, setItemType] = useState<'sitting' | 'media' | 'extra-copy'>('media');
  const [photographerStatus, setPhotographerStatus] = useState("");
  const [editorStatus, setEditorStatus] = useState("");
  const [isExtraCopy, setIsExtraCopy] = useState(false);
  const [originalItemId, setOriginalItemId] = useState("");
  const [originalItemType, setOriginalItemType] = useState<'' | 'sitting' | 'media'>('');
  const [originalSourceLink, setOriginalSourceLink] = useState("");
  const [originalEditedLink, setOriginalEditedLink] = useState("");
  const [originalPhotographerStatus, setOriginalPhotographerStatus] = useState("");
  const [originalEditorStatus, setOriginalEditorStatus] = useState("");

  // UI feedback
  const [copied, setCopied] = useState(false);
  const [editedLinkCopied, setEditedLinkCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/editors/item-details/${itemId}`);

        setSourceLink(data.sourceLink || "");
        const loadedEditedLink = data.editedLink || "";
        setEditedLink(loadedEditedLink);
        setInitialEditedLink(loadedEditedLink);
        setPhotographerStatus(data.photographerStatus || "");
        setEditorStatus(data.editorStatus || "pending");
        setIsExtraCopy(Boolean(data.isExtraCopy));
        setOriginalItemId(data.originalItemId || "");
        setOriginalItemType(data.originalItemType || "");
        setOriginalSourceLink(data.originalSourceLink || "");
        setOriginalEditedLink(data.originalEditedLink || "");
        setOriginalPhotographerStatus(data.originalPhotographerStatus || "");
        setOriginalEditorStatus(data.originalEditorStatus || "");

        // Determine item type (photographerStatus also implies sitting)
        const type = data.photographer || data.photographerStatus ? 'sitting' : 'media';
        setItemType(type);

        setLoading(false);

      } catch (err) {
        console.error("Failed to fetch details", err);
        setError("Failed to load item details");
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemDetails();
    }
  }, [itemId]);

  const handleCopySource = () => {
    const effectiveSourceLink = isExtraCopy ? originalSourceLink : sourceLink;
    if (!effectiveSourceLink) return;
    navigator.clipboard.writeText(effectiveSourceLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check restrictions
  const isSourceLinkDisabled = () => {
    const effectiveSourceLink = isExtraCopy ? originalSourceLink : sourceLink;
    if (!effectiveSourceLink) return true;

    if (isExtraCopy) {
      if (originalItemType === 'sitting') {
        return (originalPhotographerStatus || '').toLowerCase() !== 'completed';
      }
      if (originalItemType === 'media') {
        return false;
      }
    } else {
      if (itemType === 'sitting') {
        return (photographerStatus || '').toLowerCase() !== 'completed';
      }
      if (itemType === 'media' || itemType === 'extra-copy') {
        return false;
      }
    }
    return false;
  };

  const isOriginalEditedLinkDisabled = () => {
    if (!isExtraCopy || !originalEditedLink) return true;
    return (originalEditorStatus || '').toLowerCase() !== 'completed';
  };

  const formatTaskStatusLabel = (raw: string) => {
    const s = (raw || "").trim().toLowerCase();
    if (!s) return "Not set";
    if (s === "in-progress" || s === "in progress") return "In progress";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getEffectiveEditorStatus = () => (editorStatus || "pending").toLowerCase();

  const isEditorTerminalStatus = () => {
    const s = getEffectiveEditorStatus();
    return s === "completed" || s === "cancelled";
  };

  const isEditedLinkInputDisabled = () => {
    const s = getEffectiveEditorStatus();
    return s === "pending" || isEditorTerminalStatus();
  };

  const getEditedLinkInputHint = (): string => {
    const s = getEffectiveEditorStatus();
    if (s === "completed" || s === "cancelled") {
      return "This link is read-only because the item is Completed or Cancelled.";
    }
    if (s === "pending") {
      return "Set editor status to In Progress from the editing queue before entering a destination link.";
    }
    return "Make sure the link is accessible and has the correct permissions.";
  };

  const getEffectivePhotographerStatus = () =>
    ((isExtraCopy ? originalPhotographerStatus : "") || photographerStatus || "").toLowerCase();

  const getEffectiveItemType = () =>
    isExtraCopy && originalItemType ? originalItemType : itemType;

  const isUploadDisabled = () => {
    if (isEditorTerminalStatus()) return true;

    const effectiveEditorStatus = getEffectiveEditorStatus();
    const effectivePhotoStatus = getEffectivePhotographerStatus();
    const effectiveType = getEffectiveItemType();

    if (effectiveEditorStatus === "pending") return true;

    if (effectiveType === "sitting" && effectivePhotoStatus !== "completed") return true;

    return false;
  };

  const getUploadDisabledHint = (): string => {
    const effectiveEditorStatus = getEffectiveEditorStatus();
    if (effectiveEditorStatus === "completed") {
      return "This item is already marked Completed. The destination link cannot be changed.";
    }
    if (effectiveEditorStatus === "cancelled") {
      return "This item is Cancelled. The destination link cannot be submitted or changed.";
    }

    const effectivePhotoStatus = getEffectivePhotographerStatus();
    const effectiveType = getEffectiveItemType();
    const photoLabel = formatTaskStatusLabel(
      (isExtraCopy ? originalPhotographerStatus : "") || photographerStatus || "",
    );

    const editorPending = effectiveEditorStatus === "pending";
    const photoBlocking = effectiveType === "sitting" && effectivePhotoStatus !== "completed";

    if (editorPending && photoBlocking) {
      return `Update your editor status from the queue, and wait until photographer is Completed (now: ${photoLabel}).`;
    }
    if (editorPending) return "Update your editor status from the editing queue before submitting.";
    if (photoBlocking) return `Wait until photographer is Completed before submitting (now: ${photoLabel}).`;
    return "";
  };

  const getSourceLinkHint = (): string => {
    const photoLabel = formatTaskStatusLabel(
      (isExtraCopy ? originalPhotographerStatus : "") || photographerStatus || "",
    );
    return `Photographer is not Completed yet (${photoLabel}). You can see the link; Copy and Open stay off until photography is done.`;
  };

  const hasSourceLinkValue = Boolean(isExtraCopy ? originalSourceLink : sourceLink);

  const hasEditedLinkValue = Boolean(editedLink.trim());

  const isEditedLinkDirty = editedLink.trim() !== initialEditedLink.trim();

  const handleCopyEditedLink = () => {
    if (!editedLink.trim()) return;
    navigator.clipboard.writeText(editedLink.trim());
    setEditedLinkCopied(true);
    setTimeout(() => setEditedLinkCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!editedLink.trim()) {
      setError("Please enter a valid link");
      return;
    }

    if (!isEditedLinkDirty) {
      return;
    }

    if (isEditorTerminalStatus()) {
      return;
    }

    if (isUploadDisabled()) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      // Call API to save the edited link
      await axios.post("/api/editors/upload-link", {
        itemId,
        editedLink: editedLink.trim(),
      });

      toast.success("Edited media link saved successfully.");
      router.push("/editor/editing-queue");

    } catch (err) {
      console.error("Failed to save link", err);
      setError("Failed to save the link. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={PAGE_CONTENT}>
      <div className={LIST_PAGE_HEADER}>
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 cursor-pointer rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <PageHeader
            title="Upload Edited Media Link"
            icon={Upload}
            subtitle={`Item ID: ${itemId}`}
          />
        </div>
        {orderId ? (
          <Link
            href={`/editor/item/${encodeURIComponent(itemId)}?orderId=${encodeURIComponent(orderId)}`}
            className={LIST_PAGE_HEADER_SECONDARY}
            title="View item details"
          >
            <Eye className="h-4 w-4" aria-hidden />
            <span>View Item</span>
          </Link>
        ) : (
          <span
            className={`${LIST_PAGE_HEADER_SECONDARY} pointer-events-none cursor-not-allowed opacity-50`}
            title="Order ID is missing; open this page from the queue or item list so item details can load."
          >
            <Eye className="h-4 w-4" aria-hidden />
            <span>View Item</span>
          </span>
        )}
      </div>

      <div className={`${LIST_TABLE_WRAPPER} overflow-hidden divide-y divide-gray-100`}>

        {/* Source Link Section */}
        <div className="p-8 space-y-4 bg-gray-50/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isExtraCopy ? 'Original Source Media' : 'Source Media'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Access raw files uploaded by the photographer/receptionist.
              </p>
            </div>
          </div>

          {hasSourceLinkValue && isSourceLinkDisabled() && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
              {getSourceLinkHint()}
            </div>
          )}

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              {isExtraCopy ? 'Original Source Link' : 'Source Link'}
            </label>
            <div
              className={`flex items-center gap-3 ${
                isSourceLinkDisabled() && hasSourceLinkValue ? 'cursor-not-allowed' : ''
              }`}
              title={
                isSourceLinkDisabled() && hasSourceLinkValue ? getSourceLinkHint() : undefined
              }
            >
              <div
                className={`flex-1 font-mono text-sm text-gray-600 truncate bg-gray-50 p-3 rounded-lg border border-gray-100 ${
                  isSourceLinkDisabled() && hasSourceLinkValue
                    ? 'select-none opacity-60'
                    : ''
                }`}
              >
                {(isExtraCopy ? originalSourceLink : sourceLink) || "No source link available"}
              </div>

              <div
                className={`flex shrink-0 flex-wrap items-center gap-2 ${
                  isSourceLinkDisabled() ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={handleCopySource}
                  disabled={!(isExtraCopy ? originalSourceLink : sourceLink) || isSourceLinkDisabled()}
                  className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                  title={isSourceLinkDisabled() ? "Wait for photographer Completed" : ""}
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                  ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>

                {(isExtraCopy ? originalSourceLink : sourceLink) && (
                  <button
                    type="button"
                    onClick={() => openExternalLink(isExtraCopy ? originalSourceLink : sourceLink)}
                    disabled={isSourceLinkDisabled()}
                    className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50`}
                    title={isSourceLinkDisabled() ? "Wait for photographer Completed" : ""}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExtraCopy && (
          <div className="p-8 space-y-4 bg-white">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Original Edited Media</h2>
              <p className="text-sm text-gray-500 mt-1">
                Edited output from original item {originalItemId || 'source item'}.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                Original Edited Link
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 font-mono text-sm text-gray-600 truncate bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {originalEditedLink || "No edited link available"}
                </div>

                <div
                  className={`flex shrink-0 flex-wrap items-center gap-2 ${isOriginalEditedLinkDisabled() ? 'pointer-events-none opacity-60 cursor-not-allowed' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!originalEditedLink) return;
                      navigator.clipboard.writeText(originalEditedLink);
                    }}
                    disabled={isOriginalEditedLinkDisabled()}
                    className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
                    title={isOriginalEditedLinkDisabled() ? 'Edited link not ready - original editor work incomplete' : ''}
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => openExternalLink(originalEditedLink)}
                    disabled={isOriginalEditedLinkDisabled()}
                    className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50`}
                    title={isOriginalEditedLinkDisabled() ? 'Edited link not ready - original editor work incomplete' : ''}
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Submit Edited Work</h2>
            <p className="text-sm text-gray-500 mt-1">
              Provide the Google Drive link or storage path where the edited files serve.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="edited-link"
                className="text-sm font-medium text-gray-700"
              >
                Destination Link / Path <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                  <input
                    id="edited-link"
                    type="text"
                    value={editedLink}
                    onChange={(e) => setEditedLink(e.target.value)}
                    disabled={isEditedLinkInputDisabled()}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                {hasEditedLinkValue && (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyEditedLink}
                      className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none`}
                    >
                      {editedLinkCopied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                      ) : (
                        <Copy className="h-4 w-4" aria-hidden />
                      )}
                      {editedLinkCopied ? "Copied" : "Copy"}
                    </button>

                    <button
                      type="button"
                      onClick={() => openExternalLink(editedLink.trim())}
                      className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none whitespace-nowrap`}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      Open
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {getEditedLinkInputHint()}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className={`${LIST_FORM_ACTIONS} border-t border-gray-100 pt-4`}>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || isUploadDisabled() || !isEditedLinkDirty || isEditorTerminalStatus()}
              title={
                isEditorTerminalStatus()
                  ? getUploadDisabledHint()
                  : isUploadDisabled()
                    ? getUploadDisabledHint()
                    : !isEditedLinkDirty
                      ? "No changes to save"
                      : ""
              }
              className={`${LIST_PAGE_HEADER_ACTION} appearance-none disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden />
                  Submit Edited Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
