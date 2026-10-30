'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import FramedPrint from '@/components/prints/FramedPrint';
import { getPrintEnquiryHref, useFeaturedPrints, type FeaturedPrintPhoto } from '@/lib/featured-prints';

export default function PrintCollectionGrid({ photos: initialPhotos }: { photos: FeaturedPrintPhoto[] }) {
  const photos = useFeaturedPrints(initialPhotos);

  return (
    <section
      aria-label="Selected print photographs"
      className="grid min-w-0 content-start gap-x-7 gap-y-10 sm:grid-cols-2 lg:col-start-1 lg:row-start-1"
    >
      {photos.length === 0 ? (
        <p className="text-base text-foreground/65 sm:col-span-2">The print collection is being updated.</p>
      ) : photos.map((photo) => {
        const enquiryHref = getPrintEnquiryHref(photo);

        return (
          <figure key={photo.id} className="print-collection-photo min-w-0">
            <Link
              href={enquiryHref}
              aria-label={`Enquire about ${photo.title} as a print`}
              className="block w-full"
            >
              <FramedPrint
                src={photo.display || photo.image}
                alt={photo.title}
                width={photo.width}
                height={photo.height}
                sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 46vw, 430px"
              />
            </Link>
            <figcaption className="mt-4">
              <h2 className="text-lg leading-relaxed tracking-normal">{photo.title}</h2>
              <Link
                href={enquiryHref}
                className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm text-foreground/65 hover:text-foreground"
              >
                Enquire about this photograph
                <ArrowUpRight size={16} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
              </Link>
            </figcaption>
          </figure>
        );
      })}
    </section>
  );
}