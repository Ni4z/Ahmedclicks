'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '@/lib/types';

type HeroPhoto = Pick<Photo, 'title' | 'image' | 'date'>;

interface HeroSlideshowProps {
  photos: HeroPhoto[];
}

const maxHeroSlides = 5;
const recentHeroWindowDays = 10;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

function getInitialDisplayPhotos(photos: HeroPhoto[]): HeroPhoto[] {
  return getNewestFirstPhotos(photos).slice(0, maxHeroSlides);
}

function getSortableTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getNewestFirstPhotos(photos: HeroPhoto[]): HeroPhoto[] {
  return [...photos].sort(
    (first, second) =>
      getSortableTimestamp(second.date) - getSortableTimestamp(first.date)
  );
}

function shufflePhotos(photos: HeroPhoto[]): HeroPhoto[] {
  const shuffled = [...photos];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function getRecentDisplayPhotos(
  photos: HeroPhoto[],
  referenceTime = Date.now()
): HeroPhoto[] {
  const newestFirstPhotos = getNewestFirstPhotos(photos);
  const cutoffTime =
    referenceTime - recentHeroWindowDays * millisecondsPerDay;
  const recentPhotos = newestFirstPhotos.filter(
    (photo) => getSortableTimestamp(photo.date) >= cutoffTime
  );

  if (recentPhotos.length > 0) {
    return shufflePhotos(recentPhotos).slice(0, maxHeroSlides);
  }

  return newestFirstPhotos.slice(0, maxHeroSlides);
}

export default function HeroSlideshow({ photos }: HeroSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [displayPhotos, setDisplayPhotos] = useState(() =>
    getInitialDisplayPhotos(photos)
  );

  useEffect(() => {
    setDisplayPhotos(getRecentDisplayPhotos(photos));
    setCurrentSlide(0);
    setDirection(0);
  }, [photos]);

  useEffect(() => {
    if (displayPhotos.length <= 1) {
      return undefined;
    }

    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % displayPhotos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [displayPhotos.length]);

  if (displayPhotos.length === 0) {
    return (
      <section className="relative flex min-h-[70svh] w-full items-center justify-center bg-dark-secondary px-5 sm:px-6 md:min-h-[70vh]">
        <div className="text-center max-w-3xl">
          <p className="text-sm tracking-[0.4em] uppercase text-white/75 mb-4">
            NiazPhotography
          </p>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            A living archive of photographs
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Publish image assets to the connected Cloudflare R2 archive and the gallery will surface them here.
          </p>
          <Link href="/gallery" className="btn-primary inline-block">
            Explore Gallery
          </Link>
        </div>
      </section>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden md:h-screen">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          <Image
            src={displayPhotos[currentSlide]?.image || ''}
            alt={displayPhotos[currentSlide]?.title || 'Featured Photo'}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pb-20 pt-24 text-center sm:px-8 md:pb-0 md:pt-0"
      >
        <p className="mb-8 max-w-2xl text-base text-white/90 sm:text-lg md:text-xl">
          Wildlife, landscapes, roads, trees, portraits, and night skies collected in one portfolio.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/gallery" className="btn-primary inline-block">
            Explore Gallery
          </Link>
        </motion.div>
      </motion.div>

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-3 sm:bottom-8">
        {displayPhotos.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setDirection(i > currentSlide ? 1 : -1);
              setCurrentSlide(i);
            }}
            aria-label={`View featured photo ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentSlide
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 right-8 hidden text-sm tracking-widest text-white/75 md:block"
      >
        SCROLL
      </motion.div>
    </div>
  );
}
