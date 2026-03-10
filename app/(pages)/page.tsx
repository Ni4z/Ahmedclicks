import HeroVideo from '@/components/home/HeroVideo';
import FeaturedPhotos from '@/components/home/FeaturedPhotos';
import FeaturedVideos from '@/components/home/FeaturedVideos';
import Categories from '@/components/home/Categories';
import PhotographerBio from '@/components/home/PhotographerBio';
import { Metadata } from 'next';
import {
  getPhotoCategories,
  getProfilePhoto,
  getRecentPhotos,
} from '@/lib/gallery';
import { getFeaturedVideos, getVideos } from '@/lib/videos';
import { withPhotoAssetPath } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Home | NiazPhotography',
  description:
    'Wildlife, landscapes, roads, trees, portraits, night-sky photography, and video work by NiazPhotography.',
};

export default function Home() {
  const videos = getVideos();
  const heroVideo =
    videos.find((video) => video.id === 'bird') ||
    videos.find((video) => video.id === 'sequence-01') ||
    videos[0];
  const featuredPhotos = getRecentPhotos(6);
  const featuredVideos = getFeaturedVideos(2);
  const categories = getPhotoCategories();
  const profilePhoto = getProfilePhoto();

  return (
    <>
      <HeroVideo video={heroVideo} />
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
