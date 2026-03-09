import { Video } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface VideoGridProps {
  videos: Video[];
  emptyTitle: string;
  emptyDescription: string;
}

export default function VideoGrid({
  videos,
  emptyTitle,
  emptyDescription,
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-dark-tertiary bg-dark-secondary/80 p-10 text-center">
        <h3 className="text-2xl font-serif font-bold mb-3">{emptyTitle}</h3>
        <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      {videos.map((video) => (
        <article
          key={video.id}
          className="rounded-2xl border border-dark-tertiary bg-dark-secondary overflow-hidden"
        >
          <div className="bg-black">
            <video
              controls
              preload="metadata"
              playsInline
              className="block w-full h-auto max-h-[32rem]"
            >
              <source src={video.src} type={video.mimeType} />
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-accent-gold mb-4">
              <span>Video</span>
              <span className="text-dark-tertiary">/</span>
              <span>{formatDate(video.date)}</span>
            </div>

            <h3 className="text-3xl font-serif font-bold mb-3">{video.title}</h3>
            <p className="text-gray-400 leading-relaxed mb-5">{video.description}</p>
            <p className="text-sm text-gray-500">
              File: <span className="text-gray-300">{video.fileName}</span>
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
