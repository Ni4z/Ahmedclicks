'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Video } from '@/lib/types';

interface HeroVideoProps {
  video?: Video;
}

export default function HeroVideo({ video }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const element = videoRef.current;

    if (!element) {
      return;
    }

    const playVideo = async () => {
      try {
        element.muted = false;
        setIsMuted(false);
        await element.play();
      } catch {
        element.muted = true;
        setIsMuted(true);

        try {
          await element.play();
        } catch {
          // Let the native browser behavior take over if autoplay is blocked entirely.
        }
      }
    };

    void playVideo();
  }, [video?.src]);

  if (!video) {
    return (
      <section className="relative w-full min-h-[70vh] bg-dark-secondary flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <p className="text-sm tracking-[0.4em] uppercase text-accent-gold mb-4">
            NiazPhotography
          </p>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            NiazPhotography
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Wildlife, landscapes, roads, trees, portraits, and night skies collected in one portfolio.
          </p>
          <Link href="/gallery" className="btn-primary inline-block">
            Explore Gallery
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={video.src}
        autoPlay
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      >
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/45" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-6"
      >
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 tracking-wider">
          NiazPhotography
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          Wildlife, landscapes, roads, trees, portraits, and night skies collected in one portfolio.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/gallery" className="btn-primary inline-block">
            Explore Gallery
          </Link>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-8 z-20">
        <button
          type="button"
          onClick={() => {
            const element = videoRef.current;

            if (!element) {
              return;
            }

            const nextMuted = !element.muted;
            element.muted = nextMuted;
            setIsMuted(nextMuted);

            if (nextMuted === false) {
              void element.play().catch(() => {
                // Ignore if the browser requires another gesture.
              });
            }
          }}
          className="rounded-full border border-white/30 bg-black/45 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white backdrop-blur-sm hover:border-accent-gold hover:text-accent-gold transition-colors"
        >
          {isMuted ? 'Enable Sound' : 'Sound On'}
        </button>
      </div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 right-8 z-20 text-accent-gold text-sm tracking-widest"
      >
        SCROLL
      </motion.div>
    </section>
  );
}
