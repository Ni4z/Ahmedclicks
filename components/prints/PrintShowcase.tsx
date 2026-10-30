'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import FramedPrint, { getPrintAspectRatio, type PrintDimensions } from './FramedPrint';
import { useFeaturedPrints, type FeaturedPrintPhoto } from '@/lib/featured-prints';

export type PrintShowcasePhoto = FeaturedPrintPhoto;

interface PrintShowcaseProps {
  photos: PrintShowcasePhoto[];
}

export default function PrintShowcase({ photos: initialPhotos }: PrintShowcaseProps) {
  const photos = useFeaturedPrints(initialPhotos);
  const hasPhotos = photos.length > 0;
  const [selectedIndex, setCurrentPhoto] = useState(0);
  const currentPhoto = selectedIndex % Math.max(photos.length, 1);
  const [canAnimate, setCanAnimate] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, PrintDimensions>>({});
  const sectionRef = useRef<HTMLElement>(null);
  const photo = photos[currentPhoto] || photos[0];
  const nextPhotoIndex = (currentPhoto + 1) % Math.max(photos.length, 1);
  const previousPhotoIndex = (currentPhoto + Math.max(photos.length, 1) - 1) % Math.max(photos.length, 1);
  const nextPhoto = photos[nextPhotoIndex];
  const isLoaded = Boolean(photo && loadedPhotos[photo.id]);
  const isNextLoaded = Boolean(nextPhoto && loadedPhotos[nextPhoto.id]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setCanAnimate(!preference.matches);
    const updateVisibility = () => setIsVisible(!document.hidden);

    updatePreference();
    updateVisibility();
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!hasPhotos || !section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [hasPhotos]);

  useEffect(() => {
    if (
      !canAnimate || hasFocus || !isVisible || !isInView ||
      !isLoaded || !isNextLoaded || photos.length < 2
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentPhoto((previous) => (previous + 1) % photos.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [canAnimate, hasFocus, isVisible, isInView, isLoaded, isNextLoaded, photos.length, photo?.id]);

  if (!photo) return null;

  const dimensions = loadedPhotos[photo.id] || photo;
  const aspectRatio = getPrintAspectRatio(dimensions.width, dimensions.height);

  return (
    <section
      ref={sectionRef}
      className="entrance-prints"
      aria-labelledby="entrance-prints-title"
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false);
      }}
    >
      <div className="entrance-prints-inner">
        <figure className="entrance-print-preview">
          <div
            id="featured-print-preview"
            className="entrance-print-artwork"
            style={{ '--print-photo-ratio': aspectRatio } as CSSProperties}
            role="group"
            aria-roledescription="carousel"
            aria-label="Selected print photographs"
          >
            {!isLoaded ? <span className="entrance-print-loading">Loading photograph</span> : null}
            {photos.map((item, index) => (
              index === currentPhoto || index === nextPhotoIndex ||
              (index === previousPhotoIndex && loadedPhotos[item.id]) ? (
                <div
                  key={item.id}
                  className={`entrance-print-slide ${index === currentPhoto ? 'is-current' : ''}`}
                  aria-hidden={index !== currentPhoto}
                >
                  <FramedPrint
                    src={item.image}
                    alt={item.title}
                    width={item.width}
                    height={item.height}
                    loading={isInView ? 'eager' : 'lazy'}
                    sizes="(max-width: 767px) calc(100vw - 80px), (max-width: 1380px) 48vw, 620px"
                    onLoad={(dimensions) => setLoadedPhotos((previous) => ({ ...previous, [item.id]: dimensions }))}
                  />
                </div>
              ) : null
            ))}
          </div>
          <figcaption aria-live="off">
            <span className="entrance-print-current-title">{photo.title}</span>
          </figcaption>
        </figure>

        <div className="entrance-prints-copy">
          <p className="entrance-eyebrow">Nature, at home</p>
          <h2 id="entrance-prints-title">Fine Art Prints</h2>
          <p className="entrance-prints-description">
            Wildlife, landscapes, and quiet moments for your walls.
            Explore five selected photographs, available as prints by personal enquiry.
          </p>
          <div className="entrance-print-actions">
            <Link href="/prints/collection" className="btn-primary entrance-print-button">
              View Prints
              <ArrowUpRight size={18} strokeWidth={1.7} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}