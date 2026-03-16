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
            Moments in Motion
          </h2>
          <p className="text-gray-400 text-lg max-w-3xl leading-relaxed">
            A small collection of moving moments. These videos capture the
            rhythm of nature, light, and wildlife beyond the still frame,
            stored separately to preserve the performance of the portfolio.
          </p>
        </div>

        <VideoGrid
          videos={videos}
          emptyTitle="Your video section is ready"
          emptyDescription="Connect the site to your R2 archive and the media sync will populate this section automatically before development and build."
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
