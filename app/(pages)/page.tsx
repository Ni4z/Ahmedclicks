import HeroSlideshow from '@/components/home/HeroSlideshow';
import FeaturedPhotos from '@/components/home/FeaturedPhotos';
import FeaturedVideos from '@/components/home/FeaturedVideos';
import Categories from '@/components/home/Categories';
import PhotographerBio from '@/components/home/PhotographerBio';
import { Metadata } from 'next';
import {
  getFeaturedPhotos,
  getPhotos,
  getPhotoCategories,
  getProfilePhoto,
} from '@/lib/gallery';
import { getFeaturedVideos } from '@/lib/videos';
import { withPhotoAssetPath } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Home | NiazPhotography',
  description:
    'Wildlife, landscapes, roads, trees, portraits, night-sky photography, and video work by NiazPhotography.',
};

export default function Home() {
  const heroPhotos = getPhotos();
  const featuredPhotos = getFeaturedPhotos(6);
  const featuredVideos = getFeaturedVideos(2);
  const categories = getPhotoCategories();
  const profilePhoto = getProfilePhoto();

  return (
    <>
      <HeroSlideshow photos={heroPhotos} />
      <FeaturedPhotos photos={featuredPhotos} />
      <FeaturedVideos videos={featuredVideos} />
      <Categories categories={categories} />
      <PhotographerBio
        profileImage={
          profilePhoto?.image || withPhotoAssetPath('/photos/Me/Me.jpg')
        }
      />
    </>
  );
}
