'use client';

import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';

interface EntrancePhoto {
  id: string;
  title: string;
  display: string;
  position: string;
  mobilePosition: string;
}

interface EntranceSlideshowProps {
  photos: EntrancePhoto[];
}

export default function EntranceSlideshow({ photos }: EntranceSlideshowProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setIsPlaying(!motionPreference.matches);
    const updateVisibility = () => setIsVisible(!document.hidden);

    updateMotionPreference();
    updateVisibility();
    motionPreference.addEventListener('change', updateMotionPreference);
    document.addEventListener('visibilitychange', updateVisibility);

    return () => {
      motionPreference.removeEventListener('change', updateMotionPreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || isHovered || hasFocus || !isVisible || photos.length < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentPhoto((previous) => (previous + 1) % photos.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [isPlaying, isHovered, hasFocus, isVisible, photos.length]);

  const changePhoto = (direction: number) => {
    setCurrentPhoto(
      (previous) => (previous + direction + photos.length) % photos.length
    );
  };

  return (
    <section
      className="entrance-hero"
      aria-label="Selected photography"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocus(false);
        }
      }}
    >
      <div id="entrance-photographs" className="entrance-photographs">
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className={`entrance-slide ${index === currentPhoto ? 'is-current' : ''}`}
            aria-hidden={index !== currentPhoto}
            style={{
              '--photo-position': photo.position,
              '--photo-mobile-position': photo.mobilePosition,
            } as CSSProperties}
          >
            <Image
              src={photo.display}
              alt={photo.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="entrance-slide-image"
            />
          </figure>
        ))}
      </div>

      <h1 className="sr-only">NiazPhotography</h1>

      {photos.length > 0 ? (
        <div className="entrance-hero-bottom">
          <p
            className="entrance-photo-title"
            aria-live={isPlaying ? 'off' : 'polite'}
            aria-atomic="true"
          >
            {photos[currentPhoto].title}
          </p>

          {photos.length > 1 ? (
            <div className="entrance-slideshow-controls" aria-label="Slideshow controls">
              <span className="entrance-photo-count" aria-hidden="true">
                {String(currentPhoto + 1).padStart(2, '0')}
                <span> / </span>
                {String(photos.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => changePhoto(-1)}
                aria-label="Previous photograph"
                aria-controls="entrance-photographs"
                title="Previous photograph"
              >
                <ChevronLeft size={20} strokeWidth={1.6} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((previous) => !previous)}
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                aria-pressed={!isPlaying}
                aria-controls="entrance-photographs"
                title={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              >
                {isPlaying ? (
                  <Pause size={17} strokeWidth={1.6} aria-hidden="true" />
                ) : (
                  <Play size={17} strokeWidth={1.6} aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => changePhoto(1)}
                aria-label="Next photograph"
                aria-controls="entrance-photographs"
                title="Next photograph"
              >
                <ChevronRight size={20} strokeWidth={1.6} aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}