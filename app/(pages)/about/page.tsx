import type { Metadata } from 'next';
import AboutPageClient from '@/components/about/AboutPageClient';
import { getProfilePhoto } from '@/lib/gallery';
import { absoluteUrl, withPhotoAssetPath } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About | NiazPhotography',
  description:
    'The photographer behind NiazPhotography — background, approach, and the equipment used for wildlife, landscape, and astrophotography work.',
  alternates: { canonical: absoluteUrl('/about/') },
};

export default function AboutPage() {
  const profilePhoto = getProfilePhoto();

  return (
    <AboutPageClient
      profileImage={
        profilePhoto?.thumbnail ||
        withPhotoAssetPath('/photos/Me/Me.jpg', 'thumbnail')
      }
    />
  );
}
