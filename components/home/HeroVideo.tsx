'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video } from '@/lib/types';

interface HeroVideoProps {
  video?: Video;
}

export default function HeroVideo({ video }: HeroVideoProps) {
  if (!video) {
    return (
      <section className="relative w-full min-h-[70vh] bg-dark-secondary flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <p className="text-sm tracking-[0.4em] uppercase text-accent-gold mb-4">
            NiazPhotography
          </p>
          <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
            A living archive of photographs and motion
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Publish your video archive through R2 and it will appear here on the homepage.
          </p>
          <Link href="/videos" className="btn-primary inline-block">
            Explore Videos
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-screen overflow-hidden bg-black">
      <video
        src={video.src}
        autoPlay
        loop
        playsInline
        controls
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
        <p className="text-sm tracking-[0.4em] uppercase text-accent-gold mb-4">
          Featured Video
        </p>
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 tracking-wider">
          NiazPhotography
        </h1>
        <p className="text-lg md:text-xl text-gray-200 max-w-3xl mb-3">
          {video.title}
        </p>
        <p className="text-sm md:text-base text-gray-300 max-w-3xl mb-8">
          Sound is enabled. If your browser blocks autoplay audio, press play in the video controls.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/videos" className="btn-primary inline-block">
            Watch More Videos
          </Link>
        </motion.div>
      </motion.div>

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
