/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Photo } from '@/lib/types';

interface PhotoGridProps {
  photos: Photo[];
  emptyMessage?: string;
}

function renderMetadataChip(label: string) {
  return (
    <span className="rounded-full border border-dark-tertiary px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-400">
      {label}
    </span>
  );
}

export default function PhotoGrid({
  photos,
  emptyMessage = 'No photos match the current filters.',
}: PhotoGridProps) {
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dark-tertiary bg-dark-secondary p-10 text-center text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
      {photos.map((photo) => (
        <div key={photo.id} className="group mb-6 break-inside-avoid">
          <Link
            href={`/gallery/${photo.id}`}
            className="block overflow-hidden rounded-[1.4rem] border border-dark-tertiary bg-dark-secondary transition-colors duration-300 group-hover:border-accent-gold/60"
          >
            <div className="relative overflow-hidden bg-dark-secondary">
              <img
                src={photo.thumbnail}
                alt={photo.title}
                loading="lazy"
                decoding="async"
                className="block w-full h-auto transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3 text-white">
                <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80 backdrop-blur-sm">
                  {photo.category}
                </span>
                <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-white/80 backdrop-blur-sm">
                  {photo.year}
                </span>
              </div>
            </div>
            <div className="space-y-3 p-5">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white">{photo.title}</h3>
                {photo.caption ? (
                  <p className="text-sm italic text-gray-400">{photo.caption}</p>
                ) : null}
              </div>

              {photo.series || photo.location || photo.weather ? (
                <div className="flex flex-wrap gap-2">
                  {photo.series ? renderMetadataChip(`Series: ${photo.series}`) : null}
                  {photo.weather ? renderMetadataChip(photo.weather) : null}
                  {photo.location
                    ? renderMetadataChip(`Location: ${photo.location}`)
                    : null}
                </div>
              ) : null}

              {photo.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {photo.tags.slice(0, 3).map((tag) => (
                    <span
                      key={`${photo.id}-${tag}`}
                      className="rounded-full bg-dark px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {photo.tags.length > 3 ? (
                    <span className="rounded-full bg-dark px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-500">
                      +{photo.tags.length - 3} more
                    </span>
                  ) : null}
                </div>
              ) : null}

              {(photo.focalLength || photo.aperture || photo.shutterSpeed || photo.iso) ? (
                <div className="flex flex-wrap gap-2 border-t border-dark-tertiary pt-3">
                  {photo.focalLength ? (
                    <span className="rounded-full bg-dark px-3 py-1 text-[11px] tracking-[0.18em] text-gray-400">
                      {photo.focalLength}
                    </span>
                  ) : null}
                  {photo.aperture ? (
                    <span className="rounded-full bg-dark px-3 py-1 text-[11px] tracking-[0.18em] text-gray-400">
                      {photo.aperture}
                    </span>
                  ) : null}
                  {photo.shutterSpeed ? (
                    <span className="rounded-full bg-dark px-3 py-1 text-[11px] tracking-[0.18em] text-gray-400">
                      {photo.shutterSpeed}
                    </span>
                  ) : null}
                  {photo.iso ? (
                    <span className="rounded-full bg-dark px-3 py-1 text-[11px] tracking-[0.18em] text-gray-400">
                      ISO {photo.iso}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
