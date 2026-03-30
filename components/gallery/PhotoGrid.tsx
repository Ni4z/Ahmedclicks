/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import PhotoSupportCard from '@/components/gallery/PhotoSupportCard';
import { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dark-tertiary bg-dark-secondary p-10 text-center text-gray-400">
        No photos found for this category.
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
      {photos.map((photo) => (
        <div key={photo.id} className="group mb-6 break-inside-avoid">
          <Link href={`/gallery/${photo.id}`} className="block">
            <div className="relative overflow-hidden rounded-lg bg-dark-secondary">
              <img
                src={photo.thumbnail}
                alt={photo.title}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-semibold mb-1">{photo.title}</h3>
                {photo.caption && (
                  <p className="text-sm opacity-90 italic mb-1">{photo.caption}</p>
                )}
                {photo.location && (
                  <p className="text-sm opacity-90">📍 {photo.location}</p>
                )}
              </div>
            </div>
          </Link>
          <PhotoSupportCard photoTitle={photo.title} compact />
        </div>
      ))}
    </div>
  );
}
