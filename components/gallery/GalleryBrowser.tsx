'use client';

import { useEffect, useMemo, useState } from 'react';
import CategoryFilter from '@/components/gallery/CategoryFilter';
import GalleryPagination from '@/components/gallery/GalleryPagination';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import { Photo, PhotoCategory } from '@/lib/types';

interface GalleryBrowserProps {
  photos: Photo[];
  categories: PhotoCategory[];
}

const PHOTOS_PER_PAGE = 20;

export default function GalleryBrowser({
  photos,
  categories,
}: GalleryBrowserProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(
    1,
    Math.ceil(visiblePhotos.length / PHOTOS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedPhotos = useMemo(() => {
    const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;
    return visiblePhotos.slice(startIndex, startIndex + PHOTOS_PER_PAGE);
  }, [currentPage, visiblePhotos]);

  const visibleStart = visiblePhotos.length
    ? (currentPage - 1) * PHOTOS_PER_PAGE + 1
    : 0;
  const visibleEnd = Math.min(currentPage * PHOTOS_PER_PAGE, visiblePhotos.length);

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    setCurrentPage(1);
  }

  return (
    <>
      <CategoryFilter
        categories={filterOptions}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="flex items-center justify-between gap-4 mb-8 text-sm text-gray-500">
        <span>
          {visiblePhotos.length === 0
            ? '0 photos'
            : `Showing ${visibleStart}-${visibleEnd} of ${visiblePhotos.length} photos`}
        </span>
        <span>
          {activeCategory === 'All'
            ? `${categories.length} active categories`
            : activeCategory}
        </span>
      </div>

      <PhotoGrid photos={paginatedPhotos} />

      <GalleryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
