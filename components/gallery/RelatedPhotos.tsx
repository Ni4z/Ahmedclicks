import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/lib/types';

interface RelatedPhotosProps {
  photos: Photo[];
}

function renderSupportingChip(label: string) {
  return (
    <span className="rounded-full border border-dark-tertiary px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-400">
      {label}
    </span>
  );
}

export default function RelatedPhotos({ photos }: RelatedPhotosProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.32em] text-accent-gold">
            Keep Exploring
          </p>
          <h2 className="text-3xl font-serif font-bold md:text-4xl">
            Related Photos
          </h2>
        </div>
        <Link
          href="/gallery"
          className="text-sm uppercase tracking-[0.22em] text-gray-400 hover:text-accent-gold"
        >
          Browse full gallery
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo) => (
          <Link
            key={photo.id}
            href={`/gallery/${photo.id}`}
            className="group overflow-hidden rounded-3xl border border-dark-tertiary bg-dark-secondary transition-colors hover:border-accent-gold/60"
          >
            <div className="overflow-hidden bg-black/40">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={photo.thumbnail}
                  alt={photo.title}
                  fill
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-accent-gold">
                <span>{photo.category}</span>
                <span className="text-gray-600">/</span>
                <span>{photo.year}</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-bold leading-tight">
                  {photo.title}
                </h3>
                {photo.location ? (
                  <p className="text-sm text-gray-400">📍 {photo.location}</p>
                ) : photo.caption ? (
                  <p className="text-sm italic text-gray-400">
                    {photo.caption}
                  </p>
                ) : null}
              </div>

              {photo.weather || photo.country || photo.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t border-dark-tertiary pt-4">
                  {photo.weather ? renderSupportingChip(photo.weather) : null}
                  {photo.country ? renderSupportingChip(photo.country) : null}
                  {photo.tags.slice(0, 1).map((tag) => (
                    <span
                      key={`${photo.id}-${tag}`}
                      className="rounded-full border border-dark-tertiary px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
