import { motion } from 'framer-motion';
import PhotoDetail from '@/components/gallery/PhotoDetail';
import { photos } from '@/data/portfolio';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return photos.map((photo) => ({
    id: photo.id,
  }));
}

interface PhotoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const photo = photos.find((p) => p.id === id);

  if (!photo) {
    notFound();
  }

  const currentIndex = photos.findIndex((p) => p.id === id);
  const previousPhoto = currentIndex > 0 ? photos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < photos.length - 1 ? photos[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-dark">
      {/* Navigation */}
      <div className="sticky top-24 z-40 max-w-7xl mx-auto px-6 py-4 bg-dark/50 backdrop-blur">
        <Link href="/gallery" className="text-accent-gold hover:underline">
          ← Back to Gallery
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-12 px-6">
        <PhotoDetail photo={photo} />
      </div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-2 gap-8"
      >
        {previousPhoto && (
          <Link href={`/gallery/${previousPhoto.id}`}>
            <div className="group cursor-pointer">
              <p className="text-gray-500 text-sm mb-2">← Previous</p>
              <h3 className="text-xl font-serif font-bold group-hover:text-accent-gold">
                {previousPhoto.title}
              </h3>
            </div>
          </Link>
        )}
        {nextPhoto && (
          <Link href={`/gallery/${nextPhoto.id}`} className="text-right">
            <div className="group cursor-pointer text-right">
              <p className="text-gray-500 text-sm mb-2">Next →</p>
              <h3 className="text-xl font-serif font-bold group-hover:text-accent-gold">
                {nextPhoto.title}
              </h3>
            </div>
          </Link>
        )}
      </motion.div>
    </div>
  );
}
