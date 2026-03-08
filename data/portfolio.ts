import { withPhotoAssetPath } from '@/lib/site';
import { BlogPost, Equipment } from '@/lib/types';

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'capturing-wildlife-in-low-light',
    title: 'Capturing Wildlife in Low Light: Techniques and Settings',
    excerpt:
      'Learn how to photograph wildlife during dawn, dusk, and other challenging lighting conditions.',
    content: `Wildlife photography often requires shooting in challenging lighting conditions. In this guide, NiazPhotography shares a practical workflow for keeping subjects sharp when the light drops.

## Understanding Your Camera's Limits

Every camera behaves differently at higher ISO values. Spend time learning where your files still feel clean enough to edit confidently.

## Essential Camera Settings

1. **High ISO**: Push ISO only as far as needed to protect shutter speed.
2. **Fast Aperture**: Open the lens when the scene allows it.
3. **Fast Shutter Speed**: Wildlife movement usually demands speed first.
4. **Manual Control**: Lock the exposure decisions you care about most.

## Field Notes

- Track light direction before your subject arrives.
- Use bursts carefully when the action becomes unpredictable.
- Review focus often instead of trusting a whole sequence blindly.

Low-light wildlife photography is demanding, but it rewards patience and repetition.`,
    author: 'NiazPhotography',
    date: '2024-07-15',
    category: 'Wildlife Photography',
    image: withPhotoAssetPath('/photos/wildlife/DSC03370.jpg'),
    readTime: 8,
  },
  {
    id: '2',
    slug: 'astrophotography-guide-for-beginners',
    title: 'Astrophotography Guide for Beginners: Start Capturing the Stars',
    excerpt:
      'Everything you need to start making clean, confident night-sky photographs.',
    content: `Astrophotography rewards preparation more than speed. Once you understand location, timing, and exposure, the process becomes much more repeatable.

## What You Need

- A camera that allows full manual control
- A wide or moderately wide lens
- A stable tripod
- Enough time to work slowly in the dark

## Camera Settings for the Night Sky

Use the "500 Rule" as a starting point:
- Shutter speed (in seconds) = 500 / focal length
- Example: 500 / 20mm = 25 seconds

Settings to test:
- ISO: 1600-6400
- Aperture: as wide as your lens allows
- Shutter speed: 10-25 seconds depending on focal length

## Before You Shoot

- Scout the foreground in daylight if possible
- Watch the moon phase and cloud cover
- Keep a small light with you so setup stays controlled

The best astrophotography sessions usually come from planning ahead and staying patient on location.`,
    author: 'NiazPhotography',
    date: '2024-06-20',
    category: 'Astrophotography',
    image: withPhotoAssetPath('/photos/astrophotography/DSC05884-2.jpg'),
    readTime: 10,
  },
  {
    id: '3',
    slug: 'composition-tips-landscape-photography',
    title: '5 Composition Tips to Elevate Your Landscape Photography',
    excerpt:
      'A practical set of composition ideas for building stronger landscape frames.',
    content: `Composition is what turns a place into a photograph. These five ideas help create stronger structure in landscape work.

## 1. Rule of Thirds

Use it as a starting grid, not a strict rule. It helps place weight inside the frame quickly.

## 2. Leading Lines

Roads, shorelines, fences, and tree lines can all direct the eye where you want it to go.

## 3. Foreground Interest

Foreground layers give scale and make wide scenes feel more dimensional.

## 4. Layering

Look for foreground, middle ground, and background relationships before you press the shutter.

## 5. Negative Space

Clean space can make a subject feel stronger, calmer, and more deliberate.

The more often you simplify a frame before shooting, the stronger the final image becomes.`,
    author: 'NiazPhotography',
    date: '2024-05-10',
    category: 'Landscape Photography',
    image: withPhotoAssetPath('/photos/landscape/DSC04689-3.jpg'),
    readTime: 6,
  },
];

export const equipment: Equipment[] = [
  {
    id: '1',
    name: 'Sony Alpha Mirrorless Kit',
    type: 'camera',
    description:
      'Primary camera setup used across the NiazPhotography portfolio for travel, wildlife, and low-light work.',
  },
  {
    id: '2',
    name: 'Long Telephoto Zoom',
    type: 'lens',
    description:
      'Used for wildlife frames where reach and subject separation matter most.',
  },
  {
    id: '3',
    name: 'Wide-Angle Lens',
    type: 'lens',
    description:
      'For landscapes, roads, and astrophotography scenes that need breadth and atmosphere.',
  },
  {
    id: '4',
    name: 'Travel Tripod',
    type: 'accessory',
    description:
      'A stable support for night work, low-light landscapes, and long exposures.',
  },
  {
    id: '5',
    name: 'Editing Workflow',
    type: 'accessory',
    description:
      'Lightroom-based post-processing for selecting, grading, and preparing final images.',
  },
];
