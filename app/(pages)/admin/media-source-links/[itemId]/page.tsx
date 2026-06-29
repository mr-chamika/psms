import { MediaSourceLinkForm } from "@/components/media-source-link-form";

export default function AdminMediaSourceLinkPage() {
  return (
    <MediaSourceLinkForm
      basePath="/admin/media-source-links"
      title="Upload Media Source Link"
      description="Attach or replace the source link for a media order item."
    />
  );
}
