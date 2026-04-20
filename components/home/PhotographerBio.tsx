/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  aboutIntroLine,
  aboutPreviewParagraphs,
  aboutTitle,
} from '@/data/about';

interface PhotographerBioProps {
  profileImage: string;
}

export default function PhotographerBio({ profileImage }: PhotographerBioProps) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] gap-10 xl:gap-16 items-center"
        >
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="xl:ml-auto xl:max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
              {aboutTitle}
            </h2>
            <div className="space-y-4 text-sm md:text-base text-gray-400 leading-7 md:leading-8">
              <p>{aboutIntroLine}</p>
              {aboutPreviewParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-4">
              <span
                aria-hidden="true"
                className="text-3xl leading-none tracking-[0.35em] text-accent-gold"
              >
                ...
              </span>
              <Link href="/about" className="btn-primary inline-block">
                Read Full Story
              </Link>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="w-60 h-60 md:w-72 md:h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden bg-dark-secondary p-3 border border-dark-tertiary">
              <img
                src={profileImage}
                alt="NiazPhotography"
                loading="lazy"
                decoding="async"
                className="block w-full h-full object-cover rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
