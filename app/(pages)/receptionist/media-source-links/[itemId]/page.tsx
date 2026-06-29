import { MediaSourceLinkForm } from "@/components/media-source-link-form";

export default function ReceptionistMediaSourceLinkPage() {
  return (
    <MediaSourceLinkForm
      basePath="/receptionist/media-source-links"
      title="Upload Media Source Link"
      description="Attach or replace the source link for a media order item."
    />
  );
}
