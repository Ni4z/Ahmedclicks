import HeroSlideshow from '@/components/home/HeroSlideshow';
import FeaturedPhotos from '@/components/home/FeaturedPhotos';
import Categories from '@/components/home/Categories';
import PhotographerBio from '@/components/home/PhotographerBio';
import { Metadata } from 'next';
import {
  getFeaturedPhotos,
  getPhotoCategories,
  getProfilePhoto,
} from '@/lib/gallery';
import { withBasePath } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Home | NiazClicks',
  description:
    'Wildlife, landscapes, roads, trees, portraits, and night-sky photography by NiazClicks.',
};

export default function Home() {
  const featuredPhotos = getFeaturedPhotos(6);
  const categories = getPhotoCategories();
  const profilePhoto = getProfilePhoto();

  return (
    <>
      <HeroSlideshow photos={featuredPhotos.slice(0, 4)} />
      <FeaturedPhotos photos={featuredPhotos} />
      <Categories categories={categories} />
      <PhotographerBio
        profileImage={profilePhoto?.image || withBasePath('/photos/Me/Me.jpg')}
      />
    </>
  );
}
