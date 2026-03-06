'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Photo } from '@/lib/types';
import { useState } from 'react';

interface PhotoDetailProps {
  photo: Photo;
  onClose?: () => void;
}

export default function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12"
    >
      {/* Image */}
      <motion.div className="lg:col-span-2">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-dark-secondary">
          <Image
            src={photo.image}
            alt={photo.title}
            fill
            priority
            className="object-cover"
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{photo.title}</h1>

        <div className="mb-8">
          <p className="text-gray-400 mb-4">{photo.description}</p>
          {photo.location && (
            <p className="text-sm text-accent-gold mb-4">📍 {photo.location}</p>
          )}
        </div>

        {/* EXIF Data */}
        {photo.camera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 bg-dark-secondary p-6 rounded-lg"
          >
            <h3 className="text-lg font-semibold mb-4">Camera Settings</h3>
            <div className="space-y-2 text-sm">
              {photo.camera && (
                <div>
                  <span className="text-gray-500">Camera:</span>
                  <p className="text-white">{photo.camera}</p>
                </div>
              )}
              {photo.lens && (
                <div>
                  <span className="text-gray-500">Lens:</span>
                  <p className="text-white">{photo.lens}</p>
                </div>
              )}
              {photo.focalLength && (
                <div>
                  <span className="text-gray-500">Focal Length:</span>
                  <p className="text-white">{photo.focalLength}</p>
                </div>
              )}
              {photo.aperture && (
                <div>
                  <span className="text-gray-500">Aperture:</span>
                  <p className="text-white">{photo.aperture}</p>
                </div>
              )}
              {photo.shutterSpeed && (
                <div>
                  <span className="text-gray-500">Shutter Speed:</span>
                  <p className="text-white">{photo.shutterSpeed}</p>
                </div>
              )}
              {photo.iso && (
                <div>
                  <span className="text-gray-500">ISO:</span>
                  <p className="text-white">{photo.iso}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Social Share */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 pt-8 border-t border-dark-tertiary"
        >
          <h3 className="text-sm font-semibold tracking-widest mb-4">SHARE</h3>
          <div className="flex gap-4">
            {[
              { name: 'Twitter', url: '#' },
              { name: 'Facebook', url: '#' },
              { name: 'Pinterest', url: '#' },
            ].map((social) => (
              <a
                key={social.name}
                href={social.url}
                className="text-sm text-accent-gold hover:underline"
              >
                {social.name}
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
