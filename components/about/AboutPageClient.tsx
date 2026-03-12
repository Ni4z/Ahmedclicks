/* eslint-disable @next/next/no-img-element */
'use client';

import { motion } from 'framer-motion';
import { equipment } from '@/data/portfolio';

interface AboutPageClientProps {
  profileImage: string;
}

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

export default function AboutPageClient({
  profileImage,
}: AboutPageClientProps) {
  return (
    <div className="min-h-screen bg-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-20 px-6 text-center bg-dark-secondary"
      >
        <h1 className="text-5xl md:text-7xl font-serif font-bold mb-4">
          About NiazPhotography
        </h1>
        <p className="text-gray-400 text-lg">
          A portfolio shaped by real field work and a live R2 media archive
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto py-20 px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mb-20"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-4xl font-serif font-bold mb-6">My Journey</h2>
            <div className="space-y-4 text-gray-400">
              <p>
                NiazPhotography is no longer a template portfolio filled with
                borrowed images. The site now syncs its gallery and video work
                from a connected Cloudflare R2 archive during development and
                before each build.
              </p>
              <p>
                That setup keeps the publishing workflow lightweight: upload new
                files to the bucket, keep using the same archive, and the site
                will pick them up without needing manual manifest edits.
              </p>
              <p>
                The goal of the redesign is simple: make the website feel like
                your work instead of demo content, and keep the portfolio tied
                to the real media you are actively publishing.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center">
            <div className="w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden bg-dark-secondary p-3 border border-dark-tertiary">
              <img
                src={profileImage}
                alt="NiazPhotography portrait"
                loading="lazy"
                decoding="async"
                className="block w-full h-full object-cover rounded-full"
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-20"
        >
          <motion.h2
            variants={itemVariants}
            className="text-4xl font-serif font-bold mb-12"
          >
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
                <h3 className="text-xl font-serif font-bold mb-2">
                  {item.name}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-dark-secondary p-12 rounded-lg border border-dark-tertiary"
        >
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-serif font-bold mb-6"
          >
            Photography Philosophy
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="text-gray-400 leading-relaxed mb-4"
          >
            Photography here is treated as an archive of observation. The
            strongest frame is not always the loudest one; it is the one that
            stays precise, patient, and honest about what was actually in front
            of the lens.
          </motion.p>
          <motion.p variants={itemVariants} className="text-gray-400 leading-relaxed">
            The site is built to stay close to that idea: fewer placeholders,
            fewer invented details, and more emphasis on the real image and
            video collections that make up NiazPhotography.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
