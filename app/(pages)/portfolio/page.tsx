import HeroSlideshow from '@/components/home/HeroSlideshow';
import LatestUpdates, {
  LatestUpdateItem,
} from '@/components/home/LatestUpdates';
import FeaturedVideos from '@/components/home/FeaturedVideos';
import Categories from '@/components/home/Categories';
import PhotographerBio from '@/components/home/PhotographerBio';
import { Metadata } from 'next';
import {
  getPhotoCategories,
  getProfilePhoto,
  getRecentPhotos,
} from '@/lib/gallery';
import { getFeaturedVideos } from '@/lib/videos';
import { absoluteUrl, withPhotoAssetPath } from '@/lib/site';
import { blogPosts } from '@/data/portfolio';

export const metadata: Metadata = {
  title: 'NiazPhotography | Portfolio',
  description:
    'Explore the latest wildlife and landscape photography, films, field notes, and collections by Niaz, based in Duisburg, Germany.',
  alternates: { canonical: absoluteUrl('/portfolio') },
};

export default function Portfolio() {
  const heroPhotos = getRecentPhotos(8).map(({ title, display, date }) => ({
    title,
    display,
    date,
  }));
  const recentPhotos = getRecentPhotos(4);
  const latestUpdates: LatestUpdateItem[] = [
    ...recentPhotos.map((photo) => ({
      id: `photo-${photo.id}`,
      type: 'photo' as const,
      title: photo.title,
      summary: photo.caption || '',
      image: photo.thumbnail,
      href: `/gallery/${photo.id}`,
      date: photo.date,
      category: photo.category,
    })),
    ...blogPosts.map((post) => ({
      id: `post-${post.slug}`,
      type: 'post' as const,
      title: post.title,
      summary: post.excerpt,
      image: post.image,
      href: `/blog/${post.slug}`,
      date: post.date,
      category: post.category,
      readTime: post.readTime,
    })),
  ]
    .sort(
      (first, second) =>
        new Date(second.date).getTime() - new Date(first.date).getTime()
    )
    .slice(0, 4);
  const featuredVideos = getFeaturedVideos(2);
  const categories = getPhotoCategories();
  const profilePhoto = getProfilePhoto();

  return (
    <>
      <HeroSlideshow photos={heroPhotos} />
      <LatestUpdates items={latestUpdates} />
      <FeaturedVideos videos={featuredVideos} />
      <Categories categories={categories} />
      <PhotographerBio
        profileImage={
          profilePhoto?.thumbnail ||
          recentPhotos[0]?.thumbnail ||
          withPhotoAssetPath('/photos/Me/Me.jpg', 'thumbnail')
        }
      />
    </>
  );
}