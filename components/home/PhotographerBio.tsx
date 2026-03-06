'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PhotographerBio() {
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
            <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6">About Ahmed</h2>
            <p className="text-gray-400 mb-4 leading-relaxed">
              With over 15 years of experience in professional photography, I've dedicated my life to capturing the world's most breathtaking moments. From the vast savannas of Africa to the mysteries of the night sky, my work explores the beauty and wonder of our planet.
            </p>
            <p className="text-gray-400 mb-6 leading-relaxed">
              My philosophy is simple: photography is about telling stories and evoking emotions. Every image should transport the viewer to that moment, making them feel what I felt when I pressed the shutter.
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
              src="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&h=600&fit=crop"
              alt="Ahmed"
              fill
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
