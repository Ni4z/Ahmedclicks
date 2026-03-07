'use client';

import Image from 'next/image';
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
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">About NiazClicks</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              NiazClicks is a personal photography archive built around real field work and local image collections. The site now pulls directly from the folders inside the project, so the published gallery stays tied to the actual files in the repository.
            </p>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Instead of stock placeholders and template copy, the portfolio is now organized around the categories you&apos;re actively building: wildlife, landscapes, roads, trees, people, and astrophotography.
            </p>
            <Link href="/about">
              <button className="btn-primary">Read Full Story</button>
            </Link>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative h-96 rounded-lg overflow-hidden"
          >
            <Image
              src={profileImage}
              alt="NiazClicks"
              fill
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
