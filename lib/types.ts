export interface Photo {
  id: string;
  title: string;
  category: 'wildlife' | 'astrophotography' | 'landscape' | 'travel';
  image: string;
  thumbnail: string;
  description: string;
  location?: string;
  camera?: string;
  lens?: string;
  iso?: number;
  shutterSpeed?: string;
  aperture?: string;
  focalLength?: string;
  featured: boolean;
  date: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'camera' | 'lens' | 'accessory';
  description: string;
}
