import PhotoGallery from "@/components/PhotoGallery";
import PhotoGalleryUpload from "@/components/PhotoGalleryUpload";

export default function AdminPage() {
  return (
    <>
      <PhotoGalleryUpload />
      <PhotoGallery allowDelete />
    </>
  );
}
