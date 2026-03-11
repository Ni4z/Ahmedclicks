import HeroVideo from '@/components/home/HeroVideo';
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
import { getFeaturedVideos, getVideos } from '@/lib/videos';
import { withPhotoAssetPath } from '@/lib/site';
import { blogPosts } from '@/data/portfolio';

function createPhotoSummary(description: string): string {
  return description.replace(/\s*File:.*$/, '').trim();
}

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
  const latestUpdates: LatestUpdateItem[] = [
    ...getRecentPhotos(4).map((photo) => ({
      id: `photo-${photo.id}`,
      type: 'photo' as const,
      title: photo.title,
      summary: createPhotoSummary(photo.description),
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
      <HeroVideo video={heroVideo} />
      <LatestUpdates items={latestUpdates} />
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
