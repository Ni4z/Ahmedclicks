/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
          className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
        >
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">About NiazPhotography</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              NiazPhotography is a personal photography archive built around real field work and local image collections. The site now pulls directly from the folders inside the project, so the published gallery stays tied to the actual files in the repository.
            </p>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Instead of stock placeholders and template copy, the portfolio is now organized around the categories you&apos;re actively building: wildlife, landscapes, roads, trees, people, and astrophotography.
            </p>
            <Link href="/about" className="btn-primary inline-block">
              Read Full Story
            </Link>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden bg-dark-secondary p-3 border border-dark-tertiary">
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
