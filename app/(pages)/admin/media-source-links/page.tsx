import { MediaSourceLinksPage } from "@/components/media-source-links-page";

export default function AdminMediaSourceLinksPage() {
  return (
    <MediaSourceLinksPage
      basePath="/admin/media-source-links"
      title="Media Source Links"
      description="Review media order items and upload raw source links for the studio team."
    />
  );
}
