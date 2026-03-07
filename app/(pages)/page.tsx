import HeroSlideshow from '@/components/home/HeroSlideshow';
import FeaturedPhotos from '@/components/home/FeaturedPhotos';
import Categories from '@/components/home/Categories';
import PhotographerBio from '@/components/home/PhotographerBio';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home | Ahmed Photography',
  description: 'Welcome to Ahmed\'s professional photography portfolio',
};

export default function Home() {
  return (
    <>
      <HeroSlideshow />
      <FeaturedPhotos />
      <Categories />
      <PhotographerBio />
    </>
  );
}
