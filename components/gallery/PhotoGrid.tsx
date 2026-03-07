import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
}

export default function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {photos.map((photo) => (
        <div key={photo.id} className="group">
          <Link href={`/gallery/${photo.id}`} className="block">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-dark-secondary">
              <Image
                src={photo.image}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-lg font-semibold mb-1">{photo.title}</h3>
                {photo.location && (
                  <p className="text-sm opacity-90">📍 {photo.location}</p>
                )}
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
