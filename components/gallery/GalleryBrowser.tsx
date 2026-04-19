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
const ALL_WEATHER = 'All weather';
const ALL_LOCATIONS = 'All locations';
const ALL_YEARS = 'All years';
const ALL_FOCAL_LENGTHS = 'All focal lengths';
const DEFAULT_SORT = 'Newest';
const WEATHER_OPTIONS = ['Summer', 'Spring', 'Autumn', 'Winter', 'Rain'] as const;

const FOCAL_LENGTH_BUCKETS = [
  { label: '14-50mm', min: 14, max: 50 },
  { label: '51-100mm', min: 51, max: 100 },
  { label: '101-150mm', min: 101, max: 150 },
  { label: '151-200mm', min: 151, max: 200 },
  { label: '201-250mm', min: 201, max: 250 },
  { label: '251-300mm', min: 251, max: 300 },
  { label: '301-350mm', min: 301, max: 350 },
  { label: '351-400mm', min: 351, max: 400 },
  { label: '401-450mm', min: 401, max: 450 },
  { label: '451-500mm', min: 451, max: 500 },
  { label: '501-550mm', min: 501, max: 550 },
  { label: '551-600mm', min: 551, max: 600 },
] as const;

function normalizeSearchText(value: string | number | undefined | null) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearchText(value: string | number | undefined | null) {
  return normalizeSearchText(value).split(' ').filter(Boolean);
}

function compactSearchToken(value: string) {
  return value.replace(/[^a-z0-9]/g, '');
}

function levenshteinDistance(first: string, second: string) {
  if (first === second) {
    return 0;
  }

  if (first.length === 0) {
    return second.length;
  }

  if (second.length === 0) {
    return first.length;
  }

  const previousRow = Array.from(
    { length: second.length + 1 },
    (_, index) => index
  );

  for (let firstIndex = 0; firstIndex < first.length; firstIndex += 1) {
    let previousDiagonal = previousRow[0];
    previousRow[0] = firstIndex + 1;

    for (let secondIndex = 0; secondIndex < second.length; secondIndex += 1) {
      const temp = previousRow[secondIndex + 1];
      const substitutionCost =
        first[firstIndex] === second[secondIndex] ? 0 : 1;
      previousRow[secondIndex + 1] = Math.min(
        previousRow[secondIndex + 1] + 1,
        previousRow[secondIndex] + 1,
        previousDiagonal + substitutionCost
      );
      previousDiagonal = temp;
    }
  }

  return previousRow[second.length];
}

function extractFocalLengthValue(focalLength?: string) {
  if (!focalLength) {
    return null;
  }

  const match = focalLength.match(/\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const numericValue = Number.parseFloat(match[0]);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function getFocalLengthBucketLabel(focalLength?: string) {
  const numericValue = extractFocalLengthValue(focalLength);

  if (numericValue === null) {
    return null;
  }

  const bucket = FOCAL_LENGTH_BUCKETS.find(
    ({ min, max }) => numericValue >= min && numericValue <= max
  );

  return bucket?.label ?? null;
}

function getPhotoSearchValues(photo: Photo) {
  const focalLengthBucket = getFocalLengthBucketLabel(photo.focalLength);

  return [
    photo.title,
    photo.caption,
    photo.category,
    photo.series,
    photo.weather,
    photo.location,
    String(photo.year),
    photo.camera,
    photo.lens,
    photo.focalLength,
    focalLengthBucket || undefined,
    photo.aperture,
    photo.shutterSpeed,
    photo.iso !== undefined ? `ISO ${photo.iso}` : undefined,
    photo.iso !== undefined ? String(photo.iso) : undefined,
    ...photo.tags,
  ].filter(Boolean) as string[];
}

function queryTokenMatchesCandidateToken(
  queryToken: string,
  candidateToken: string
) {
  if (
    candidateToken.includes(queryToken) ||
    queryToken.includes(candidateToken)
  ) {
    return true;
  }

  const compactQuery = compactSearchToken(queryToken);
  const compactCandidate = compactSearchToken(candidateToken);

  if (!compactQuery || !compactCandidate) {
    return false;
  }

  if (
    compactCandidate.includes(compactQuery) ||
    compactQuery.includes(compactCandidate)
  ) {
    return true;
  }

  if (Math.min(compactQuery.length, compactCandidate.length) < 4) {
    return false;
  }

  const maxDistance =
    compactQuery.length >= 8 && compactCandidate.length >= 8 ? 2 : 1;

  return levenshteinDistance(compactQuery, compactCandidate) <= maxDistance;
}

function matchesSearchQuery(photo: Photo, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchValues = getPhotoSearchValues(photo);
  const normalizedHaystack = searchValues
    .map((value) => normalizeSearchText(value))
    .filter(Boolean)
    .join(' ');

  if (normalizedHaystack.includes(normalizedQuery)) {
    return true;
  }

  const queryTokens = tokenizeSearchText(normalizedQuery);
  const candidateTokens = searchValues.flatMap((value) => tokenizeSearchText(value));

  return queryTokens.every((queryToken) =>
    candidateTokens.some((candidateToken) =>
      queryTokenMatchesCandidateToken(queryToken, candidateToken)
    )
  );
}

function hasActiveFilters({
  activeCategory,
  activeLocation,
  activeWeather,
  activeTag,
  activeYear,
  activeFocalLength,
  searchQuery,
  sortOrder,
}: {
  activeCategory: string;
  activeLocation: string;
  activeWeather: string;
  activeTag: string;
  activeYear: string;
  activeFocalLength: string;
  searchQuery: string;
  sortOrder: string;
}) {
  return (
    activeCategory !== ALL_CATEGORIES ||
    activeTag !== ALL_TAGS ||
    activeWeather !== ALL_WEATHER ||
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
  const [activeWeather, setActiveWeather] = useState(ALL_WEATHER);
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
    const locations = new Map<string, number>();
    const years = new Map<number, number>();
    const focalLengths = new Map<string, number>();
    const weatherCounts = new Map<string, number>();

    for (const photo of photos) {
      years.set(photo.year, (years.get(photo.year) || 0) + 1);

      if (photo.weather) {
        weatherCounts.set(photo.weather, (weatherCounts.get(photo.weather) || 0) + 1);
      }

      if (photo.location) {
        locations.set(photo.location, (locations.get(photo.location) || 0) + 1);
      }

      const focalLengthBucket = getFocalLengthBucketLabel(photo.focalLength);

      if (focalLengthBucket) {
        focalLengths.set(
          focalLengthBucket,
          (focalLengths.get(focalLengthBucket) || 0) + 1
        );
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
      tags: Array.from(tags.entries()).sort(compareLabels),
      years: Array.from(years.entries()).sort(
        ([firstYear], [secondYear]) => secondYear - firstYear
      ),
      focalLengths: FOCAL_LENGTH_BUCKETS.map(({ label }) => [
        label,
        focalLengths.get(label) || 0,
      ] as [string, number]).filter(([, count]) => count > 0),
      weather: WEATHER_OPTIONS.map((w) => [
        w,
        weatherCounts.get(w) || 0,
      ] as [string, number]).filter(([, count]) => count > 0),
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

      if (activeWeather !== ALL_WEATHER && photo.weather !== activeWeather) {
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
        getFocalLengthBucketLabel(photo.focalLength) !== activeFocalLength
      ) {
        return false;
      }

      return matchesSearchQuery(photo, deferredSearchQuery);
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
    activeWeather,
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
    activeWeather,
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
    setActiveWeather(ALL_WEATHER);
    setActiveLocation(ALL_LOCATIONS);
    setActiveYear(ALL_YEARS);
    setActiveFocalLength(ALL_FOCAL_LENGTHS);
    setSortOrder(DEFAULT_SORT);
  }

  const filterSummary = [
    activeCategory !== ALL_CATEGORIES ? activeCategory : null,
    activeYear !== ALL_YEARS ? activeYear : null,
    activeFocalLength !== ALL_FOCAL_LENGTHS ? activeFocalLength : null,
    activeWeather !== ALL_WEATHER ? activeWeather : null,
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

      <div className="mb-10 rounded-[1.75rem] border border-dark-tertiary bg-dark-secondary/70 p-4 sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <label className="xl:col-span-2">
            <span className="mb-2 block text-xs uppercase tracking-[0.3em] text-gray-500">
              Search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Title, series, tag, weather, location, camera..."
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
              Weather
            </span>
            <select
              value={activeWeather}
              onChange={(event) => setActiveWeather(event.target.value)}
              className="w-full"
            >
              <option>{ALL_WEATHER}</option>
              {facetOptions.weather.map(([weather, count]) => (
                <option key={weather} value={weather}>
                  {weather} ({count})
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
            activeWeather,
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

      <div className="mb-8 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span>
          {visiblePhotos.length === 0
            ? '0 photos'
            : `Showing ${visibleStart}-${visibleEnd} of ${visiblePhotos.length} photos`}
        </span>
        <span className="max-w-full text-left sm:text-right">
          {filterSummary || `${categories.length} active categories`}
        </span>
      </div>

      <PhotoGrid
        photos={paginatedPhotos}
        emptyMessage="No photos match this combination of category, tag, weather, location, year, and search filters."
      />

      <GalleryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
