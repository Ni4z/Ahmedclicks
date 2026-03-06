import PhotoGrid from '@/components/gallery/PhotoGrid';
import { photos } from '@/data/portfolio';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <div className="py-20 px-6 text-center bg-dark-secondary">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">Gallery</h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Explore my complete collection of photography across multiple genres
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <PhotoGrid photos={photos} />
      </div>
    </div>
  );
}
