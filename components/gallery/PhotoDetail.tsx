/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Photo } from '@/lib/types';

interface PhotoDetailProps {
  photo: Photo;
  shareUrl?: string;
}

function renderDetailPill(label: string, value: string | number) {
  return (
    <div className="rounded-full border border-dark-tertiary px-4 py-2 text-sm text-foreground">
      <span className="text-gray-500">{label}:</span>{' '}
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export default function PhotoDetail({ photo, shareUrl }: PhotoDetailProps) {
  const [instagramFeedback, setInstagramFeedback] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const encodedUrl = encodeURIComponent(shareUrl || '');
  const encodedTitle = encodeURIComponent(photo.title);
  const printEnquiryHref = `/prints?photo=${encodeURIComponent(photo.title)}${
    shareUrl ? `&url=${encodeURIComponent(shareUrl)}` : ''
  }`;
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

  async function shareToInstagramMessage() {
    const currentUrl =
      shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

    setInstagramFeedback(null);

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: photo.title,
          text: `${photo.title} • ${photo.category}`,
          url: currentUrl,
        });
        setInstagramFeedback(
          'Share sheet opened. Choose Instagram if it is available on your device.'
        );
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl);
        setInstagramFeedback(
          'Link copied. Open Instagram and share it in a message.'
        );
        return;
      }
    } catch {}

    setInstagramFeedback(
      'Instagram sharing is not directly available in this browser. Copy the page URL into Instagram manually.'
    );
  }

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
        {/* Image */}
        <div className="lg:col-span-2">
          <div className="relative rounded-lg overflow-hidden bg-dark-secondary p-4">
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute right-8 top-8 z-10 rounded-full border border-white/20 bg-black/55 px-4 py-2 text-xs uppercase tracking-[0.24em] text-white backdrop-blur-sm transition-colors hover:border-accent-gold hover:text-accent-gold"
            >
              Fullscreen
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="block w-full cursor-zoom-in"
              aria-label={`Open ${photo.title} fullscreen`}
            >
              <img
                src={photo.image}
                alt={photo.title}
                className="block max-w-full max-h-[80vh] w-auto h-auto mx-auto"
              />
            </button>
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{photo.title}</h1>

          {photo.caption || photo.location ? (
            <div className="mb-8">
              {photo.caption ? (
                <p className="mb-4 italic text-gray-400">{photo.caption}</p>
              ) : null}
              {photo.location ? (
                <p className="text-sm text-accent-gold mb-4">📍 {photo.location}</p>
              ) : null}
            </div>
          ) : null}

          <div className="mb-8 flex flex-wrap gap-3">
            <Link href={printEnquiryHref} className="btn-primary inline-flex items-center justify-center">
              Request This as a Print
            </Link>
            <Link
              href="/prints"
              className="inline-flex items-center justify-center rounded-full border border-dark-tertiary px-5 py-3 text-xs uppercase tracking-[0.28em] text-gray-400 transition-colors hover:border-accent-gold hover:text-accent-gold"
            >
              Prints & Licensing
            </Link>
          </div>

          <div className="mb-8 rounded-2xl border border-dark-tertiary bg-dark-secondary p-6">
            <h3 className="mb-4 text-lg font-semibold">Photo Metadata</h3>
            <div className="flex flex-wrap gap-3">
              {renderDetailPill('Category', photo.category)}
              {renderDetailPill('Year', photo.year)}
              {photo.weather ? renderDetailPill('Weather', photo.weather) : null}
              {photo.country ? renderDetailPill('Country', photo.country) : null}
            </div>

            {photo.tags.length > 0 ? (
              <div className="mt-5">
                <p className="mb-3 text-xs tracking-[0.3em] text-gray-500 uppercase">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {photo.tags.map((tag) => (
                    <span
                      key={`${photo.id}-${tag}`}
                      className="rounded-full border border-dark-tertiary px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* EXIF Data */}
          {(photo.camera || photo.lens || photo.focalLength || photo.aperture || photo.shutterSpeed || photo.iso) && (
            <div className="space-y-4 bg-dark-secondary p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Camera Settings</h3>
              <div className="space-y-2 text-sm">
                {photo.camera && (
                  <div>
                    <span className="text-gray-500">Camera:</span>
                    <p className="text-foreground">{photo.camera}</p>
                  </div>
                )}
                {photo.lens && (
                  <div>
                    <span className="text-gray-500">Lens:</span>
                    <p className="text-foreground">{photo.lens}</p>
                  </div>
                )}
                {photo.focalLength && (
                  <div>
                    <span className="text-gray-500">Focal Length:</span>
                    <p className="text-foreground">{photo.focalLength}</p>
                  </div>
                )}
                {photo.aperture && (
                  <div>
                    <span className="text-gray-500">Aperture:</span>
                    <p className="text-foreground">{photo.aperture}</p>
                  </div>
                )}
                {photo.shutterSpeed && (
                  <div>
                    <span className="text-gray-500">Shutter Speed:</span>
                    <p className="text-foreground">{photo.shutterSpeed}</p>
                  </div>
                )}
                {photo.iso && (
                  <div>
                    <span className="text-gray-500">ISO:</span>
                    <p className="text-foreground">{photo.iso}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Share */}
          <div className="mt-8 pt-8 border-t border-dark-tertiary">
            <h3 className="text-sm font-semibold tracking-widest mb-4">SHARE</h3>
            <div className="flex flex-wrap gap-4">
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
              <button
                type="button"
                onClick={shareToInstagramMessage}
                className="text-sm text-accent-gold hover:underline"
              >
                Instagram Message
              </button>
            </div>
            {instagramFeedback ? (
              <p className="mt-3 text-xs text-gray-400">{instagramFeedback}</p>
            ) : null}
          </div>

          <div className="mt-8">
            <Link href="/gallery" className="text-sm text-gray-400 hover:text-accent-gold">
              ← Back to gallery
            </Link>
          </div>
        </div>
      </div>

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/92 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${photo.title} fullscreen view`}
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-5 top-5 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs uppercase tracking-[0.26em] text-white transition-colors hover:border-accent-gold hover:text-accent-gold"
          >
            Close
          </button>
          <div
            className="flex max-h-full max-w-full flex-col items-center gap-4"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={photo.image}
              alt={photo.title}
              className="block max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
            />
            <div className="text-center">
              <p className="text-lg font-serif font-bold text-white">{photo.title}</p>
              {photo.location ? (
                <p className="mt-1 text-sm text-gray-400">📍 {photo.location}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
