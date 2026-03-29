'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from '@/lib/types';

interface HeroSlideshowProps {
  photos: Photo[];
}

const maxHeroSlides = 5;

function getInitialDisplayPhotos(photos: Photo[]): Photo[] {
  return photos.slice(0, maxHeroSlides);
}

function shufflePhotos(photos: Photo[]): Photo[] {
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

export default function HeroSlideshow({ photos }: HeroSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [displayPhotos, setDisplayPhotos] = useState(() =>
    getInitialDisplayPhotos(photos)
  );

  useEffect(() => {
    if (photos.length <= 1) {
      setDisplayPhotos(photos);
      setCurrentSlide(0);
      setDirection(0);
      return;
    }

    setDisplayPhotos(shufflePhotos(photos).slice(0, maxHeroSlides));
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
      <section className="relative w-full min-h-[70vh] bg-dark-secondary flex items-center justify-center px-6">
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
    <div className="relative w-full h-screen overflow-hidden">
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
        className="absolute inset-0 flex flex-col items-center justify-center text-center z-10"
      >
        <h1 className="mb-4 font-signature text-[3.75rem] leading-[0.9] tracking-[0.01em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:text-[5.5rem] lg:text-[6.75rem]">
          Niaz Photography
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
          Wildlife, landscapes, roads, trees, portraits, and night skies collected in one portfolio.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/gallery" className="btn-primary inline-block">
            Explore Gallery
          </Link>
        </motion.div>
      </motion.div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
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
        className="absolute bottom-8 right-8 text-sm tracking-widest text-white/75"
      >
        SCROLL
      </motion.div>
    </div>
  );
}
