import Link from 'next/link';
import { Video } from '@/lib/types';
import VideoGrid from '@/components/video/VideoGrid';

interface FeaturedVideosProps {
  videos: Video[];
}

export default function FeaturedVideos({ videos }: FeaturedVideosProps) {
  return (
    <section className="py-20 px-6 bg-dark-secondary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-5xl md:text-6xl font-serif font-bold mb-4">
            Video Work
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed">
            A dedicated motion section for your portfolio, designed to serve
            larger video files from your external video archive instead of the
            Git repository.
          </p>
        </div>

        <VideoGrid
          videos={videos}
          emptyTitle="Your video section is ready"
          emptyDescription="Point the site at your published video archive with NEXT_PUBLIC_VIDEO_BASE_URL, or keep small local test files in public/videos during development."
        />

        <div className="text-center mt-16">
          <Link href="/videos" className="btn-secondary inline-block">
            Open Full Video Section
          </Link>
        </div>
      </div>
    </section>
  );
}
