'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { equipment } from '@/data/portfolio';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 px-6 text-center bg-dark-secondary"
      >
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">About Ahmed</h1>
        <p className="text-gray-400 text-lg">Professional Photographer Since 2008</p>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20"
        >
          {/* Text */}
          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-serif font-bold mb-6">My Journey</h2>
            <div className="space-y-4 text-gray-400">
              <p>
                What started as a hobby with my father&apos;s old film camera has transformed into a lifelong passion. For over 15 years, I&apos;ve traveled to more than 80 countries, capturing the raw beauty of our planet.
              </p>
              <p>
                My approach to photography is deeply philosophical. I don&apos;t just take pictures; I tell stories. Every frame is carefully composed to evoke emotion and transport the viewer to that exact moment in time.
              </p>
              <p>
                Whether I&apos;m tracking through the African savanna, waiting for the northern lights, or exploring hidden corners of bustling cities, photography allows me to see the world with fresh eyes every single day.
              </p>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div variants={itemVariants} className="relative h-96 rounded-lg overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1559027615-cd2628902d4a?w=600&h=600&fit=crop"
              alt="Ahmed working"
              fill
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Equipment */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.h2 variants={itemVariants} className="text-4xl font-serif font-bold mb-12">
            My Gear
          </motion.h2>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {equipment.map((item) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="p-6 bg-dark-secondary rounded-lg border border-dark-tertiary hover:border-accent-gold transition-colors"
              >
                <div className="text-sm text-accent-gold mb-2 uppercase tracking-widest">
                  {item.type}
                </div>
                <h3 className="text-xl font-serif font-bold mb-2">{item.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-dark-secondary p-12 rounded-lg border border-dark-tertiary"
        >
          <motion.h2 variants={itemVariants} className="text-3xl font-serif font-bold mb-6">
            Photography Philosophy
          </motion.h2>
          <motion.p variants={itemVariants} className="text-gray-400 leading-relaxed mb-4">
            Photography is the art of frozen time. It&apos;s about capturing not just what we see, but what we feel. Every great photograph tells a story—of adventure, beauty, struggle, or wonder.
          </motion.p>
          <motion.p variants={itemVariants} className="text-gray-400 leading-relaxed">
            My mission is to create images that move people, that make them want to explore, that inspire them to see the world in a new light. In a world of digital noise, I strive to create images that matter, images that resonate, images that last.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
