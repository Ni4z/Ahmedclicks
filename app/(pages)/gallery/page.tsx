import GalleryBrowser from '@/components/gallery/GalleryBrowser';
import { getPhotoCategories, getPhotos } from '@/lib/gallery';

export default function GalleryPage() {
  const photos = getPhotos();
  const categories = getPhotoCategories();

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="py-20 px-6 text-center bg-dark-secondary">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">Gallery</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          A live archive built from the photo folders inside this repository, organized by category.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <GalleryBrowser photos={photos} categories={categories} />
      </div>
    </div>
  );
}
