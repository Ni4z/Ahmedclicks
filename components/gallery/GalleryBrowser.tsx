'use client';

import { useMemo, useState } from 'react';
import CategoryFilter from '@/components/gallery/CategoryFilter';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import { Photo, PhotoCategory } from '@/lib/types';

interface GalleryBrowserProps {
  photos: Photo[];
  categories: PhotoCategory[];
}

export default function GalleryBrowser({
  photos,
  categories,
}: GalleryBrowserProps) {
  const [activeCategory, setActiveCategory] = useState('All');

  const filterOptions = useMemo(
    () => ['All', ...categories.map((category) => category.name)],
    [categories]
  );

  const visiblePhotos = useMemo(() => {
    if (activeCategory === 'All') {
      return photos;
    }

    return photos.filter((photo) => photo.category === activeCategory);
  }, [activeCategory, photos]);

  return (
    <>
      <CategoryFilter
        categories={filterOptions}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <div className="flex items-center justify-between gap-4 mb-8 text-sm text-gray-500">
        <span>{visiblePhotos.length} photos</span>
        <span>
          {activeCategory === 'All'
            ? `${categories.length} active categories`
            : activeCategory}
        </span>
      </div>

      <PhotoGrid photos={visiblePhotos} />
    </>
  );
}
