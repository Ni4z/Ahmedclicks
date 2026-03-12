import AboutPageClient from '@/components/about/AboutPageClient';
import { getProfilePhoto } from '@/lib/gallery';
import { withPhotoAssetPath } from '@/lib/site';

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
