import type { Metadata } from 'next';
import AboutPageClient from '@/components/about/AboutPageClient';
import { getProfilePhoto } from '@/lib/gallery';
import { withPhotoAssetPath } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About | NiazPhotography',
  description:
    'The photographer behind NiazPhotography — background, approach, and the equipment used for wildlife, landscape, and astrophotography work.',
};

export default function AboutPage() {
  const profilePhoto = getProfilePhoto();

  return (
    <AboutPageClient
      profileImage={
        profilePhoto?.image || withPhotoAssetPath('/photos/Me/Me.jpg')
      }
    />
  );
}
