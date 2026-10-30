import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Mail } from 'lucide-react';
import EntranceSlideshow from '@/components/home/EntranceSlideshow';
import EntranceHeader from '@/components/layout/EntranceHeader';
import PrintShowcase from '@/components/prints/PrintShowcase';
import { featuredPrintPaths } from '@/data/portfolio';
import { getPhotos, getProfilePhoto } from '@/lib/gallery';
import { createStableAssetId } from '@/lib/media-assets';
import { absoluteUrl, siteConfig } from '@/lib/site';
import '@/styles/entrance.css';

export const metadata: Metadata = {
  title: 'NiazPhotography | Wildlife & Landscape Photography',
  description:
    'Wildlife, landscape, and nature photography by Niaz. A closer look at the natural world, from Duisburg, Germany.',
  alternates: { canonical: absoluteUrl('/') },
};

const openingSelections = [
  {
    path: 'wildlife/Hatchlings Caring.jpg',
    position: 'center 50%',
    mobilePosition: '80% center',
  },
  {
    path: 'landscape/The Alpen VIllage.jpg',
    position: 'center 52%',
    mobilePosition: '50% center',
  },
  {
    path: 'wildlife/Roe Deer First light.jpg',
    position: 'center 55%',
    mobilePosition: '75% center',
  },
];

export default function Home() {
  const photos = getPhotos();
  const selectedPhotos = openingSelections.flatMap((selection) => {
    const photo = photos.find(
      (candidate) =>
        candidate.id === createStableAssetId(selection.path, 'photo')
    );

    return photo
      ? [{
          id: photo.id,
          title: photo.title,
          display: photo.image,
          position: selection.position,
          mobilePosition: selection.mobilePosition,
        }]
      : [];
  });
  const openingPhotos = selectedPhotos.length
    ? selectedPhotos
    : photos.slice(0, 3).map((photo) => ({
        id: photo.id,
        title: photo.title,
        display: photo.image,
        position: 'center',
        mobilePosition: 'center',
      }));
  const profilePhoto = getProfilePhoto();
  const printPhotos = featuredPrintPaths.flatMap((relativePath) => {
    const photo = photos.find(
      (candidate) => candidate.id === createStableAssetId(relativePath, 'photo')
    );

    if (!photo) return [];

    return [{
      id: photo.id,
      title: photo.title,
      image: photo.image,
      width: photo.width,
      height: photo.height,
    }];
  });

  return (
    <div className="entrance">
      <EntranceHeader />

      <EntranceSlideshow photos={openingPhotos} />

      <section className="entrance-introduction" aria-labelledby="entrance-about">
        <div className="entrance-introduction-copy">
          <p className="entrance-eyebrow">Behind the lens</p>
          <h2 id="entrance-about">Nature is worth a closer look.</h2>
          <p className="entrance-introduction-text">
            I&apos;m Niaz, a photographer based in Duisburg, Germany. My work
            follows wildlife, changing landscapes, and the small details that
            are easy to pass by. A deer in the morning mist. Light finding its
            way through a forest. Moments that make you stop and look again.
          </p>
          <div className="entrance-introduction-links">
            <Link href="/about" className="entrance-text-link">
              Meet Niaz
              <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden="true" />
            </Link>
            <Link href="/contact" className="entrance-text-link">
              Get in touch
              <ArrowUpRight size={18} strokeWidth={1.6} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {profilePhoto ? (
          <figure className="entrance-portrait">
            <div className="entrance-portrait-image">
              <Image
                src={profilePhoto.display}
                alt="Niaz, the photographer behind NiazPhotography"
                fill
                sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1199px) 40vw, 460px"
                className="entrance-portrait-photo"
              />
            </div>
            <figcaption>Niaz. Duisburg, Germany.</figcaption>
          </figure>
        ) : null}
      </section>

      <PrintShowcase photos={printPhotos} />

      <footer className="entrance-footer">
        <p>&copy; {new Date().getFullYear()} NiazPhotography</p>
        <nav aria-label="Footer navigation">
          <Link href="/prints">Prints</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy">Privacy</Link>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="entrance-social-link"
            aria-label="Email NiazPhotography"
            title="Email Niaz"
          >
            <Mail size={18} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </nav>
      </footer>
    </div>
  );
}
