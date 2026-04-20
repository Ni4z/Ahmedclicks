export interface Photo {
  id: string;
  title: string;
  caption?: string;
  category: string;
  categoryKey: string;
  tags: string[];
  series?: string;
  weather?: string;
  country?: string;
  image: string;
  thumbnail: string;
  description: string;
  location?: string;
  year: number;
  camera?: string;
  lens?: string;
  iso?: number;
  shutterSpeed?: string;
  aperture?: string;
  focalLength?: string;
  featured: boolean;
  date: string;
}

export interface PhotoCategory {
  key: string;
  name: string;
  description: string;
  count: number;
  coverImage: string;
}

export interface Video {
  id: string;
  title: string;
  src: string;
  caption?: string;
  description: string;
  fileName: string;
  mimeType: string;
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
