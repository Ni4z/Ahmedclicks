import type { Metadata } from 'next';
import VideoGrid from '@/components/video/VideoGrid';
import { getVideos } from '@/lib/videos';

export const metadata: Metadata = {
  title: 'Videos | NiazPhotography',
  description:
    'Video work and motion studies published from the NiazPhotography portfolio.',
};

export default function VideosPage() {
  const videos = getVideos();

  return (
    <div className="min-h-screen bg-dark">
      <div className="py-20 px-6 text-center bg-dark-secondary">
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">Videos</h1>
        <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
          A motion section that can be served from an external video archive,
          which keeps large media files out of the Git repository while still
          publishing them on the site.
        </p>
        <p className="mt-6 text-sm uppercase tracking-[0.35em] text-accent-gold">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'} in archive
        </p>
      </div>

      <div className="max-w-7xl mx-auto py-20 px-6">
        <VideoGrid
          videos={videos}
          emptyTitle="No videos published yet"
          emptyDescription="Connect the site to your R2 archive and the media sync will populate this page automatically before development and build."
        />
      </div>
    </div>
  );
}
