import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PhotoDetail from '@/components/gallery/PhotoDetail';
import { getPhotos } from '@/lib/gallery';
import { absoluteUrl } from '@/lib/site';

type PhotoDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return getPhotos().map((photo) => ({
    id: photo.id,
  }));
}

export async function generateMetadata({
  params,
}: PhotoDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const photos = getPhotos();
  const photo = photos.find((entry) => entry.id === id);

  if (!photo) {
    return {
      title: 'Photo Not Found | NiazPhotography',
    };
  }

  return {
    title: `${photo.title} | NiazPhotography`,
    description: photo.description,
    openGraph: {
      title: photo.title,
      description: photo.description,
      url: absoluteUrl(`/gallery/${photo.id}/`),
      images: [
        {
          url: absoluteUrl(photo.image),
          alt: photo.title,
        },
      ],
    },
  };
}

export default async function PhotoDetailPage({
  params,
}: PhotoDetailPageProps) {
  const { id } = await params;
  const photos = getPhotos();
  const photoIndex = photos.findIndex((entry) => entry.id === id);

  if (photoIndex === -1) {
    notFound();
  }

  const photo = photos[photoIndex];
  const previousPhoto =
    photoIndex > 0 ? photos[photoIndex - 1] : photos[photos.length - 1];
  const nextPhoto =
    photoIndex < photos.length - 1 ? photos[photoIndex + 1] : photos[0];

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <PhotoDetail
          photo={photo}
          shareUrl={absoluteUrl(`/gallery/${photo.id}/`)}
        />

        <div className="border-t border-dark-tertiary pt-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href={`/gallery/${previousPhoto.id}`}
            className="p-5 rounded-lg border border-dark-tertiary hover:border-accent-gold transition-colors"
          >
            <span className="block text-xs tracking-[0.3em] text-gray-500 uppercase mb-2">
              Previous
            </span>
            <span className="font-serif text-xl">{previousPhoto.title}</span>
          </Link>

          <Link
            href="/gallery"
            className="text-center text-sm tracking-[0.3em] uppercase text-gray-400 hover:text-accent-gold"
          >
            All Photos
          </Link>

          <Link
            href={`/gallery/${nextPhoto.id}`}
            className="p-5 rounded-lg border border-dark-tertiary hover:border-accent-gold transition-colors text-right"
          >
            <span className="block text-xs tracking-[0.3em] text-gray-500 uppercase mb-2">
              Next
            </span>
            <span className="font-serif text-xl">{nextPhoto.title}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
