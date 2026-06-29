"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LIST_FORM_ACTIONS, LIST_PAGE_HEADER_ACTION, LIST_PAGE_HEADER_SECONDARY, PAGE_CONTENT } from "@/lib/list-page-styles";
import { openExternalLink } from "@/lib/utils";

type MediaSourceLinkFormProps = {
  basePath: string;
  title: string;
  description: string;
};

export function MediaSourceLinkForm({ basePath, title, description }: MediaSourceLinkFormProps) {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [itemName, setItemName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [existingSourceLink, setExistingSourceLink] = useState("");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/media-source-links/${itemId}`);
        setOrderId(data.orderId || "");
        setItemName(data.item || "");
        setClientName(data.orderName || "");
        setClientPhone(data.orderPhone || "");
        setSourceLink(data.sourceLink || "");
        setExistingSourceLink(data.sourceLink || "");
      } catch (fetchError) {
        console.error("Failed to load media item", fetchError);
        setError("Failed to load media item details");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItem();
    }
  }, [itemId]);

  const isDirty = sourceLink.trim() !== existingSourceLink.trim();

  const handleCopy = async () => {
    if (!sourceLink) return;
    await navigator.clipboard.writeText(sourceLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!sourceLink.trim()) {
      setError("Please enter a valid source link");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await axios.post(`/api/media-source-links/${itemId}`, {
        sourceLink: sourceLink.trim(),
      });

      toast.success("Source link saved successfully.");
      router.push(basePath);
      router.refresh();
    } catch (saveError) {
      console.error("Failed to save source link", saveError);
      setError("Failed to save the source link. Please try again.");
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
    <div className={`max-w-3xl mx-auto ${PAGE_CONTENT} animate-fade-in`}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(basePath)} className="rounded-full hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        <div className="p-6 md:p-8 bg-gray-50/50 space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-gray-900">Client Details</h2>
            <p className="text-sm text-gray-500">Context for the media order item before adding the source link.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Client Name</label>
              <p className="text-sm font-medium text-gray-900">{clientName || "Unknown Client"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Client Phone</label>
              <p className="text-sm font-medium text-gray-900">{clientPhone || "Not available"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Order ID</label>
              <p className="text-sm font-mono text-gray-900">{orderId || "Unknown"}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Media Item</label>
              <p className="text-sm font-medium text-gray-900">{itemName || "Media item"}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-4 bg-gray-50/50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Source Media</h2>
              <p className="text-sm text-gray-500 mt-1">Access raw files uploaded for this media order item.</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm group space-y-3">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Source Link</label>
            <Input
              value={sourceLink}
              onChange={(e) => setSourceLink(e.target.value)}
              placeholder="https://..."
              className="w-full h-10 font-mono text-sm text-gray-600 bg-gray-50 border-gray-100"
            />

            <div className={`${LIST_FORM_ACTIONS} mt-4`}>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!sourceLink}
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
                onClick={() => openExternalLink(sourceLink)}
                disabled={!sourceLink.trim()}
                className={`${LIST_PAGE_HEADER_SECONDARY} appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                Open
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty || !sourceLink.trim()}
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
        </div>
      </div>
    </div>
  );
}
