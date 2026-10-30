import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Camera, Mail, MapPin } from 'lucide-react';
import PrintCollectionGrid from '@/components/prints/PrintCollectionGrid';
import { featuredPrintPaths } from '@/data/portfolio';
import { getPhotos } from '@/lib/gallery';
import { createStableAssetId } from '@/lib/media-assets';
import { absoluteUrl, siteConfig } from '@/lib/site';
import '@/styles/entrance.css';

export const metadata: Metadata = {
  title: 'Fine Art Prints | NiazPhotography',
  description:
    'Five selected wildlife and landscape photographs by Niaz, with contact details for personal print enquiries.',
  alternates: { canonical: absoluteUrl('/prints/collection/') },
};

export default function PrintCollectionPage() {
  const photos = getPhotos();
  const collection = featuredPrintPaths.flatMap((relativePath) => {
    const photo = photos.find(
      (candidate) => candidate.id === createStableAssetId(relativePath, 'photo')
    );

    return photo ? [photo] : [];
  });

  return (
    <div className="min-h-screen bg-dark">
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-9 sm:px-8 sm:pt-12">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground/65 hover:text-foreground"
        >
          <ArrowLeft size={17} strokeWidth={1.6} aria-hidden="true" />
          Back to home
        </Link>

        <header className="mb-10 mt-5">
          <h1 className="text-4xl leading-tight tracking-normal sm:text-5xl">
            Fine Art Prints
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-foreground/65">
            Selected photographs, available as prints by personal enquiry.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
          <aside
            aria-labelledby="print-contact-title"
            className="self-start border-y border-dark-tertiary py-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-start-1 lg:border-t-0 lg:pt-0"
          >
            <h2 id="print-contact-title" className="text-2xl tracking-normal">
              Contact Niaz
            </h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs text-foreground/65">Email</dt>
                <dd>
                  <a
                    href={`mailto:${siteConfig.contactEmail}`}
                    className="inline-flex min-h-11 items-center gap-2 break-all"
                  >
                    <Mail size={17} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
                    {siteConfig.contactEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/65">Instagram</dt>
                <dd>
                  <a
                    href={siteConfig.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 break-all"
                  >
                    <Camera size={17} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
                    @{siteConfig.instagramHandle}
                    <ArrowUpRight size={14} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-foreground/65">Based in</dt>
                <dd className="mt-2 flex items-center gap-2">
                  <MapPin size={17} strokeWidth={1.6} className="shrink-0" aria-hidden="true" />
                  Duisburg, Germany
                </dd>
              </div>
            </dl>
            <p className="mt-6 text-sm leading-7 text-foreground/65">
              Sizes, paper, and finish are arranged personally for each print.
            </p>
          </aside>

          <PrintCollectionGrid photos={collection.map((photo) => ({
            id: photo.id,
            title: photo.title,
            image: photo.image,
            display: photo.display,
            width: photo.width,
            height: photo.height,
            galleryUrl: absoluteUrl(`/gallery/${photo.id}/`),
          }))} />
        </div>
      </div>
    </div>
  );
}