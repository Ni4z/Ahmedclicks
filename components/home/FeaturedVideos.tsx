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
            A dedicated motion section for your portfolio. Drop MP4, WebM, MOV,
            or M4V files into <span className="text-white">public/videos</span>{' '}
            and they will appear here on the next build.
          </p>
        </div>

        <VideoGrid
          videos={videos}
          emptyTitle="Your video section is ready"
          emptyDescription="Add your first videos to public/videos and this section will automatically start showing them. MP4 or WebM is recommended for the broadest browser support."
        />

        <div className="text-center mt-16">
          <Link href="/videos">
            <button className="btn-secondary">Open Full Video Section</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
