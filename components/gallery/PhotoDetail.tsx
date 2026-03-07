import Image from 'next/image';
import Link from 'next/link';
import { Photo } from '@/lib/types';

interface PhotoDetailProps {
  photo: Photo;
  shareUrl?: string;
}

export default function PhotoDetail({ photo, shareUrl }: PhotoDetailProps) {
  const encodedUrl = encodeURIComponent(shareUrl || '');
  const encodedTitle = encodeURIComponent(photo.title);
  const socialLinks = [
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Email',
      url: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
      {/* Image */}
      <div className="lg:col-span-2">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-dark-secondary">
          <Image
            src={photo.image}
            alt={photo.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>

      {/* Details */}
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{photo.title}</h1>

        <div className="mb-8">
          <p className="text-gray-400 mb-4">{photo.description}</p>
          {photo.location && (
            <p className="text-sm text-accent-gold mb-4">📍 {photo.location}</p>
          )}
        </div>

        {/* EXIF Data */}
        {photo.camera && (
          <div className="space-y-4 bg-dark-secondary p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Camera Settings</h3>
            <div className="space-y-2 text-sm">
              {photo.camera && (
                <div>
                  <span className="text-gray-500">Camera:</span>
                  <p className="text-white">{photo.camera}</p>
                </div>
              )}
              {photo.lens && (
                <div>
                  <span className="text-gray-500">Lens:</span>
                  <p className="text-white">{photo.lens}</p>
                </div>
              )}
              {photo.focalLength && (
                <div>
                  <span className="text-gray-500">Focal Length:</span>
                  <p className="text-white">{photo.focalLength}</p>
                </div>
              )}
              {photo.aperture && (
                <div>
                  <span className="text-gray-500">Aperture:</span>
                  <p className="text-white">{photo.aperture}</p>
                </div>
              )}
              {photo.shutterSpeed && (
                <div>
                  <span className="text-gray-500">Shutter Speed:</span>
                  <p className="text-white">{photo.shutterSpeed}</p>
                </div>
              )}
              {photo.iso && (
                <div>
                  <span className="text-gray-500">ISO:</span>
                  <p className="text-white">{photo.iso}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Social Share */}
        <div className="mt-8 pt-8 border-t border-dark-tertiary">
          <h3 className="text-sm font-semibold tracking-widest mb-4">SHARE</h3>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent-gold hover:underline"
              >
                {social.name}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Link href="/gallery" className="text-sm text-gray-400 hover:text-accent-gold">
            ← Back to gallery
          </Link>
        </div>
      </div>
    </div>
  );
}
