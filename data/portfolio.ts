import { Photo, BlogPost, Equipment } from '@/lib/types';

export const photos: Photo[] = [
  {
    id: '1',
    title: 'African Elephant at Sunset',
    category: 'wildlife',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=300&h=300&fit=crop',
    description: 'A majestic African elephant walking through the savanna during golden hour.',
    location: 'Serengeti, Tanzania',
    camera: 'Canon EOS R5',
    lens: 'RF 100-500mm F4.5-7.1L IS USM',
    iso: 1600,
    shutterSpeed: '1/500s',
    aperture: 'f/7.1',
    focalLength: '500mm',
    featured: true,
    date: '2024-06-15',
  },
  {
    id: '2',
    title: 'Milky Way Over Mountains',
    category: 'astrophotography',
    image: 'https://images.unsplash.com/photo-1462332420958-a05d1e7413413?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1462332420958-a05d1e7413413?w=300&h=300&fit=crop',
    description: 'Stunning Milky Way galaxy visible above snow-capped mountain peaks.',
    location: 'Swiss Alps',
    camera: 'Sony A7R IV',
    lens: 'Zeiss Milvus 2.8/21',
    iso: 3200,
    shutterSpeed: '25s',
    aperture: 'f/2.8',
    focalLength: '21mm',
    featured: true,
    date: '2024-05-20',
  },
  {
    id: '3',
    title: 'Mountain Lake Reflection',
    category: 'landscape',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    description: 'Crystal clear alpine lake reflecting towering mountain peaks.',
    location: 'Rocky Mountains, Canada',
    camera: 'Nikon Z7 II',
    lens: 'Z Mount 24-70mm f/2.8 S',
    iso: 100,
    shutterSpeed: '1/125s',
    aperture: 'f/11',
    focalLength: '35mm',
    featured: true,
    date: '2024-07-10',
  },
  {
    id: '4',
    title: 'Motorbike in Vietnam',
    category: 'travel',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&h=300&fit=crop',
    description: 'Adventurous motorbike ride through the lush Vietnamese countryside.',
    location: 'Hanoi, Vietnam',
    camera: 'Fujifilm X-T4',
    lens: 'XF 35mm f/1.4 R',
    iso: 400,
    shutterSpeed: '1/250s',
    aperture: 'f/2.8',
    focalLength: '35mm',
    featured: true,
    date: '2024-04-12',
  },
  {
    id: '5',
    title: 'Arctic Fox Portrait',
    category: 'wildlife',
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=300&h=300&fit=crop',
    description: 'Close-up portrait of an Arctic fox in its natural habitat.',
    location: 'Arctic Circle, Norway',
    camera: 'Canon EOS R3',
    lens: 'RF 70-200mm f/2.8L IS USM',
    iso: 2000,
    shutterSpeed: '1/1000s',
    aperture: 'f/4',
    focalLength: '200mm',
    featured: false,
    date: '2024-03-08',
  },
  {
    id: '6',
    title: 'Aurora Borealis Dance',
    category: 'astrophotography',
    image: 'https://images.unsplash.com/photo-1419984905471-ed7da714205c?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1419984905471-ed7da714205c?w=300&h=300&fit=crop',
    description: 'Breathtaking Northern Lights illuminating the Arctic night sky.',
    location: 'Iceland',
    camera: 'Sony A7S III',
    lens: 'Sony FE 20mm f/1.8 G',
    iso: 6400,
    shutterSpeed: '15s',
    aperture: 'f/1.8',
    focalLength: '20mm',
    featured: false,
    date: '2024-02-14',
  },
  {
    id: '7',
    title: 'Waterfall in Jungle',
    category: 'landscape',
    image: 'https://images.unsplash.com/photo-1493514789560-586cb221b553?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1493514789560-586cb221b553?w=300&h=300&fit=crop',
    description: 'Powerful waterfall cascading through tropical jungle.',
    location: 'Costa Rica',
    camera: 'Nikon Z6 II',
    lens: 'Z Mount 16-35mm f/4 S',
    iso: 200,
    shutterSpeed: '1s',
    aperture: 'f/16',
    focalLength: '35mm',
    featured: false,
    date: '2024-06-22',
  },
  {
    id: '8',
    title: 'Desert Caravan',
    category: 'travel',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop',
    description: 'Camel caravan crossing the vast Sahara desert landscape.',
    location: 'Morocco',
    camera: 'Fujifilm GFX100S',
    lens: 'GF 63mm f/2.8 R WR',
    iso: 400,
    shutterSpeed: '1/250s',
    aperture: 'f/5.6',
    focalLength: '63mm',
    featured: false,
    date: '2024-05-05',
  },
];

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'capturing-wildlife-in-low-light',
    title: 'Capturing Wildlife in Low Light: Techniques and Settings',
    excerpt: 'Learn how to photograph wildlife during dawn, dusk, and other challenging lighting conditions.',
    content: `Wildlife photography often requires shooting in challenging lighting conditions. In this comprehensive guide, I'll share the techniques and camera settings I use to capture stunning wildlife photos in low light.

## Understanding Your Camera's Limits

Most cameras have different performance levels at various ISO settings. Understanding your camera's capabilities is crucial before heading out into the field.

## Essential Camera Settings

1. **High ISO**: Don't be afraid to push your ISO. Modern cameras handle noise well.
2. **Fast Aperture**: Use the widest aperture available on your lens.
3. **Fast Shutter Speed**: Typically 1/500s or faster to avoid motion blur.
4. **Manual Mode**: Take full control of your exposure.

## Pro Tips for Success

- Use back-button focus for more control
- Enable autofocus tracking
- Use continuous shooting mode
- Post-process to reduce noise

Wildlife in low light is challenging but incredibly rewarding. Practice these techniques and you'll be amazed at what you can capture.`,
    author: 'Ahmed',
    date: '2024-07-15',
    category: 'Wildlife Photography',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&h=600&fit=crop',
    readTime: 8,
  },
  {
    id: '2',
    slug: 'astrophotography-guide-for-beginners',
    title: 'Astrophotography Guide for Beginners: Start Capturing the Stars',
    excerpt: 'Everything you need to know to start taking amazing nighttime and milky way photographs.',
    content: `Astrophotography is one of the most rewarding types of photography. When you see your first clear image of the Milky Way, you'll understand why photographers are so passionate about this genre.

## What You Need

- A DSLR or mirrorless camera capable of manual mode
- A wide-angle lens (14-24mm is ideal)
- A sturdy tripod
- A remote shutter release (optional but highly recommended)

## Camera Settings for Milky Way

Use the "500 Rule" to calculate shutter speed:
- Shutter Speed (in seconds) = 500 / Focal Length
- Example: 500 / 20mm = 25 seconds

Settings to try:
- ISO: 3200-6400
- Aperture: f/1.4-f/2.8 (as wide as possible)
- Shutter Speed: 20-25 seconds

## Finding Dark Skies

The most important factor is location. Use apps like Dark Sky Finder to locate areas with minimal light pollution.

Happy astrophotography!`,
    author: 'Ahmed',
    date: '2024-06-20',
    category: 'Astrophotography',
    image: 'https://images.unsplash.com/photo-1462332420958-a05d1e7413413?w=1200&h=600&fit=crop',
    readTime: 10,
  },
  {
    id: '3',
    slug: 'composition-tips-landscape-photography',
    title: '5 Composition Tips to Elevate Your Landscape Photography',
    excerpt: 'Master the fundamentals of composition to create more compelling landscape images.',
    content: `Composition is the foundation of great photography. These five tips will help you create more visually compelling landscape images.

## 1. Rule of Thirds

Divide your frame into nine equal sections. Place interesting compositional elements along these lines or at their intersections.

## 2. Leading Lines

Use natural lines in the landscape to guide the viewer's eye through the image. Roads, rivers, and horizons work well.

## 3. Foreground Interest

Include something interesting in the foreground to add depth and dimension to your images.

## 4. Layering

Create depth by including foreground, middle ground, and background elements.

## 5. Negative Space

Don't be afraid of empty space. It can make your subject more powerful.

Practice these techniques and watch your landscape photography improve dramatically.`,
    author: 'Ahmed',
    date: '2024-05-10',
    category: 'Landscape Photography',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop',
    readTime: 6,
  },
];

export const equipment: Equipment[] = [
  {
    id: '1',
    name: 'Canon EOS R5',
    type: 'camera',
    description: 'Full-frame mirrorless camera with excellent autofocus and 45MP sensor.',
  },
  {
    id: '2',
    name: 'Sony A7R IV',
    type: 'camera',
    description: 'High-resolution full-frame mirrorless camera with 61MP sensor.',
  },
  {
    id: '3',
    name: 'Canon RF 100-500mm F4.5-7.1L IS USM',
    type: 'lens',
    description: 'Professional telephoto zoom lens perfect for wildlife photography.',
  },
  {
    id: '4',
    name: 'Sony FE 20mm f/1.8 G',
    type: 'lens',
    description: 'Ultra-wide fast lens ideal for astrophotography and landscapes.',
  },
  {
    id: '5',
    name: 'Manfrotto Befree Advanced Tripod',
    type: 'accessory',
    description: 'Lightweight aluminum tripod perfect for travel and astrophotography.',
  },
  {
    id: '6',
    name: 'Lee Filters ND Kit',
    type: 'accessory',
    description: 'Neutral density filter set for long exposure landscape photography.',
  },
];
