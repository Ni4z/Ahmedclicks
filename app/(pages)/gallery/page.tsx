import GalleryBrowser from '@/components/gallery/GalleryBrowser';
import { getPhotoCategories, getPhotos } from '@/lib/gallery';
import { withObjectStorageAssetPath } from '@/lib/media-assets';

export default function GalleryPage() {
  const photos = getPhotos();
  const categories = getPhotoCategories();
  const heroBackground = withObjectStorageAssetPath(
    'photos-web/landscape/DSC04689-3.jpg'
  );

  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="relative overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 bg-dark-secondary">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url("${heroBackground}")` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.68)_0%,rgba(18,18,18,0.82)_55%,rgba(10,10,10,0.92)_100%)]" />
        </div>
        <div className="relative z-10">
          <h1 className="mb-4 text-5xl font-serif font-bold md:text-7xl">Gallery</h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-200/80">
            A curated collection of moments where light, nature, and life meet.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <GalleryBrowser photos={photos} categories={categories} />
      </div>
    </div>
  );
}
