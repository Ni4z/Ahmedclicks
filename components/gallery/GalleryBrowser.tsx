'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import CategoryFilter from '@/components/gallery/CategoryFilter';
import GalleryPagination from '@/components/gallery/GalleryPagination';
import PhotoGrid from '@/components/gallery/PhotoGrid';
import { Photo, PhotoCategory } from '@/lib/types';

interface GalleryBrowserProps {
  photos: Photo[];
  categories: PhotoCategory[];
}

const PHOTOS_PER_PAGE = 20;
const ALL_CATEGORIES = 'All';
const ALL_TAGS = 'All tags';
const ALL_SERIES = 'All series';
const ALL_LOCATIONS = 'All locations';
const ALL_YEARS = 'All years';
const ALL_FOCAL_LENGTHS = 'All focal lengths';
const DEFAULT_SORT = 'Newest';

function hasActiveFilters({
  activeCategory,
  activeLocation,
  activeSeries,
  activeTag,
  activeYear,
  activeFocalLength,
  searchQuery,
  sortOrder,
}: {
  activeCategory: string;
  activeLocation: string;
  activeSeries: string;
  activeTag: string;
  activeYear: string;
  activeFocalLength: string;
  searchQuery: string;
  sortOrder: string;
}) {
  return (
    activeCategory !== ALL_CATEGORIES ||
    activeTag !== ALL_TAGS ||
    activeSeries !== ALL_SERIES ||
    activeLocation !== ALL_LOCATIONS ||
    activeYear !== ALL_YEARS ||
    activeFocalLength !== ALL_FOCAL_LENGTHS ||
    searchQuery.trim().length > 0 ||
    sortOrder !== DEFAULT_SORT
  );
}

export default function GalleryBrowser({
  photos,
  categories,
}: GalleryBrowserProps) {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState(ALL_TAGS);
  const [activeSeries, setActiveSeries] = useState(ALL_SERIES);
  const [activeLocation, setActiveLocation] = useState(ALL_LOCATIONS);
  const [activeYear, setActiveYear] = useState(ALL_YEARS);
  const [activeFocalLength, setActiveFocalLength] = useState(ALL_FOCAL_LENGTHS);
  const [sortOrder, setSortOrder] = useState(DEFAULT_SORT);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const filterOptions = useMemo(
    () => [
      { name: ALL_CATEGORIES, count: photos.length },
      ...categories.map((category) => ({
        name: category.name,
        count: category.count,
      })),
    ],
    [categories, photos.length]
  );

  const facetOptions = useMemo(() => {
    const tags = new Map<string, number>();
    const series = new Map<string, number>();
    const locations = new Map<string, number>();
    const years = new Map<number, number>();
    const focalLengths = new Map<string, number>();

    for (const photo of photos) {
      years.set(photo.year, (years.get(photo.year) || 0) + 1);

      if (photo.series) {
        series.set(photo.series, (series.get(photo.series) || 0) + 1);
      }

      if (photo.location) {
        locations.set(photo.location, (locations.get(photo.location) || 0) + 1);
      }

      if (photo.focalLength) {
        focalLengths.set(photo.focalLength, (focalLengths.get(photo.focalLength) || 0) + 1);
      }

      for (const tag of photo.tags) {
        tags.set(tag, (tags.get(tag) || 0) + 1);
      }
    }

    const compareLabels = (
      [firstLabel]: [string, number],
      [secondLabel]: [string, number]
    ) =>
      firstLabel.localeCompare(secondLabel, undefined, {
        sensitivity: 'base',
      });

    return {
      locations: Array.from(locations.entries()).sort(compareLabels),
      series: Array.from(series.entries()).sort(compareLabels),
      tags: Array.from(tags.entries()).sort(compareLabels),
      years: Array.from(years.entries()).sort(
        ([firstYear], [secondYear]) => secondYear - firstYear
      ),
      focalLengths: Array.from(focalLengths.entries()).sort(
        ([a], [b]) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        }
      ),
    };
  }, [photos]);

  const visiblePhotos = useMemo(() => {
    const filteredPhotos = photos.filter((photo) => {
      if (
        activeCategory !== ALL_CATEGORIES &&
        photo.category !== activeCategory
      ) {
        return false;
      }

      if (activeTag !== ALL_TAGS && !photo.tags.includes(activeTag)) {
        return false;
      }

      if (activeSeries !== ALL_SERIES && photo.series !== activeSeries) {
        return false;
      }

      if (
        activeLocation !== ALL_LOCATIONS &&
        photo.location !== activeLocation
      ) {
        return false;
      }

      if (activeYear !== ALL_YEARS && String(photo.year) !== activeYear) {
        return false;
      }

      if (
        activeFocalLength !== ALL_FOCAL_LENGTHS &&
        photo.focalLength !== activeFocalLength
      ) {
        return false;
      }

      if (!deferredSearchQuery) {
        return true;
      }

      const searchableContent = [
        photo.title,
        photo.caption,
        photo.category,
        photo.series,
        photo.location,
        String(photo.year),
        photo.tags.join(' '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableContent.includes(deferredSearchQuery);
    });

    const sortedPhotos = filteredPhotos.slice();

    sortedPhotos.sort((firstPhoto, secondPhoto) => {
      switch (sortOrder) {
        case 'Oldest':
          return (
            new Date(firstPhoto.date).getTime() -
            new Date(secondPhoto.date).getTime()
          );
        case 'Title A-Z':
          return firstPhoto.title.localeCompare(secondPhoto.title, undefined, {
            sensitivity: 'base',
          });
        case 'Title Z-A':
          return secondPhoto.title.localeCompare(firstPhoto.title, undefined, {
            sensitivity: 'base',
          });
        case DEFAULT_SORT:
        default:
          return (
            new Date(secondPhoto.date).getTime() -
            new Date(firstPhoto.date).getTime()
          );
      }
    });

    return sortedPhotos;
  }, [
    activeCategory,
    activeFocalLength,
    activeLocation,
    activeSeries,
    activeTag,
    activeYear,
    deferredSearchQuery,
    photos,
    sortOrder,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(visiblePhotos.length / PHOTOS_PER_PAGE)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeCategory,
    activeFocalLength,
    activeLocation,
    activeSeries,
    activeTag,
    activeYear,
    deferredSearchQuery,
    sortOrder,
  ]);

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
  const visibleEnd = Math.min(
    currentPage * PHOTOS_PER_PAGE,
    visiblePhotos.length
  );

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
  }

  function clearFilters() {
    setSearchQuery('');
    setActiveCategory(ALL_CATEGORIES);
    setActiveTag(ALL_TAGS);
    setActiveSeries(ALL_SERIES);
    setActiveLocation(ALL_LOCATIONS);
    setActiveYear(ALL_YEARS);
    setActiveFocalLength(ALL_FOCAL_LENGTHS);
    setSortOrder(DEFAULT_SORT);
  }

  const filterSummary = [
    activeCategory !== ALL_CATEGORIES ? activeCategory : null,
    activeYear !== ALL_YEARS ? activeYear : null,
    activeFocalLength !== ALL_FOCAL_LENGTHS ? activeFocalLength : null,
    activeSeries !== ALL_SERIES ? activeSeries : null,
    activeLocation !== ALL_LOCATIONS ? activeLocation : null,
    activeTag !== ALL_TAGS ? `#${activeTag}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <>
      <CategoryFilter
        categories={filterOptions}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      <div className="mb-10 rounded-[1.75rem] border border-dark-tertiary bg-dark-secondary/70 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
              Search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Title, tag, series, location..."
              className="w-full"
            />
          </label>

          <label>
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
              Sort
            </span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="w-full"
            >
              <option>{DEFAULT_SORT}</option>
              <option>Oldest</option>
              <option>Title A-Z</option>
              <option>Title Z-A</option>
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
              Year
            </span>
            <select
              value={activeYear}
              onChange={(event) => setActiveYear(event.target.value)}
              className="w-full"
            >
              <option>{ALL_YEARS}</option>
              {facetOptions.years.map(([year, count]) => (
                <option key={year} value={year}>
                  {year} ({count})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
              Series
            </span>
            <select
              value={activeSeries}
              onChange={(event) => setActiveSeries(event.target.value)}
              className="w-full"
            >
              <option>{ALL_SERIES}</option>
              {facetOptions.series.map(([series, count]) => (
                <option key={series} value={series}>
                  {series} ({count})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
              Location
            </span>
            <select
              value={activeLocation}
              onChange={(event) => setActiveLocation(event.target.value)}
              className="w-full"
            >
              <option>{ALL_LOCATIONS}</option>
              {facetOptions.locations.map(([location, count]) => (
                <option key={location} value={location}>
                  {location} ({count})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="lg:min-w-[18rem]">
              <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
                Tag
              </span>
              <select
                value={activeTag}
                onChange={(event) => setActiveTag(event.target.value)}
                className="w-full"
              >
                <option>{ALL_TAGS}</option>
                {facetOptions.tags.map(([tag, count]) => (
                  <option key={tag} value={tag}>
                    {tag} ({count})
                  </option>
                ))}
              </select>
            </label>

            <label className="lg:min-w-[12rem]">
              <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
                Focal Length
              </span>
              <select
                value={activeFocalLength}
                onChange={(event) => setActiveFocalLength(event.target.value)}
                className="w-full"
              >
                <option>{ALL_FOCAL_LENGTHS}</option>
                {facetOptions.focalLengths.map(([fl, count]) => (
                  <option key={fl} value={fl}>
                    {fl} ({count})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasActiveFilters({
            activeCategory,
            activeFocalLength,
            activeLocation,
            activeSeries,
            activeTag,
            activeYear,
            searchQuery,
            sortOrder,
          }) ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-dark-tertiary px-5 py-3 text-xs uppercase tracking-[0.28em] text-gray-400 transition-colors hover:border-accent-gold hover:text-accent-gold"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between gap-4 text-sm text-gray-500">
        <span>
          {visiblePhotos.length === 0
            ? '0 photos'
            : `Showing ${visibleStart}-${visibleEnd} of ${visiblePhotos.length} photos`}
        </span>
        <span>{filterSummary || `${categories.length} active categories`}</span>
      </div>

      <PhotoGrid
        photos={paginatedPhotos}
        emptyMessage="No photos match this combination of category, tag, series, location, year, and search filters."
      />

      <GalleryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
