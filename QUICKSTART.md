# Quick Start Guide

## 5-Minute Setup

### 1. Install & Run
```bash
cd website
npm install
npm run dev
```

Visit `http://localhost:3000` 🎉

### 2. Update Your Info
Edit `data/portfolio.ts`:
- Replace sample photos with your own
- Update blog posts
- Add/remove equipment

### 3. Customize Branding
Edit `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Your Name - Photography Portfolio',
  description: 'Your bio here',
};
```

Edit `components/layout/Navbar.tsx`:
```typescript
<Link href="/" className="text-2xl font-serif font-bold tracking-widest">
  YOUR_NAME  {/* Change this */}
</Link>
```

### 4. Build & Deploy
```bash
npm run build
vercel deploy
```

Done! Your portfolio is live. ✨

---

## Key Files to Modify

| File | Purpose |
|------|---------|
| `data/portfolio.ts` | Add your photos, blog posts, equipment |
| `app/layout.tsx` | Site metadata and title |
| `components/layout/Navbar.tsx` | Navigation and branding |
| `tailwind.config.ts` | Colors and theme |
| `.env.local` | Google Analytics ID |

---

## Adding Photos

1. Find high-quality images to use
2. Edit `data/portfolio.ts`
3. Add new entry to photos array:

```typescript
{
  id: '9',
  title: 'Mountain Vista',
  category: 'landscape',
  image: 'https://your-image-url.jpg',
  thumbnail: 'https://your-image-url-small.jpg',
  description: 'Beautiful mountain landscape',
  location: 'Alps, Europe',
  camera: 'Your Camera',
  // ... other EXIF data
  featured: true,  // Show on home page
  date: '2024-03-01',
}
```

---

## Adding Blog Posts

Edit `data/portfolio.ts`:

```typescript
{
  id: '4',
  slug: 'my-photography-tips',
  title: 'Photography Tips for Beginners',
  excerpt: 'Learn the basics...',
  content: 'Your full article content with ## for headings',
  author: 'Your Name',
  date: '2024-03-01',
  category: 'Photography Tips',
  image: 'https://your-image.jpg',
  readTime: 5,
}
```

---

## Recommended Image Sources

Free/Affordable:
- **Unsplash** - Free high-res photos
- **Pexels** - Free stock photos
- **Pixabay** - Free photos and vectors
- **Your own photos** - Best option!

For your own photos, upload to:
- **Cloudinary** - Free tier for optimization
- **Vercel Blob** - Integrated with Vercel (easy!)
- **AWS S3** - More complex but reliable
- **Firebase Storage** - Google's solution

---

## Customization Examples

### Change Primary Color
Edit `tailwind.config.ts`:
```typescript
'accent-gold': '#FF6B35',  // Change from gold to orange
```

### Change Fonts
Edit `app/layout.tsx`:
```typescript
import { Merriweather, Lato } from 'next/font/google';
// Then use these new fonts
```

### Change Hero Section Text
Edit `components/home/HeroSlideshow.tsx`:
```typescript
<h1 className="text-5xl md:text-7xl font-serif font-bold mb-4 tracking-wider">
  YOUR NAME HERE
</h1>
```

---

## Testing Locally

```bash
# Start dev server
npm run dev

# Visit these URLs:
# Home: http://localhost:3000
# Gallery: http://localhost:3000/gallery
# About: http://localhost:3000/about
# Blog: http://localhost:3000/blog
# Contact: http://localhost:3000/contact
```

---

## Common Customizations

### Add Social Links
Edit `components/layout/Footer.tsx`:
```typescript
const socialLinks = [
  { name: 'Instagram', href: 'https://instagram.com/yourprofile', icon: 'I' },
  { name: 'Twitter', href: 'https://twitter.com/yourprofile', icon: 'T' },
  // Add more
];
```

### Change Contact Info
Edit `app/(pages)/contact/page.tsx`:
```typescript
<a href="mailto:your@email.com">
  your@email.com
</a>
```

### Update About Bio
Edit `app/(pages)/about/page.tsx`:
```typescript
<p className="text-gray-400">
  Your biography here...
</p>
```

---

## Performance Tips

✅ **Image Optimization**
- Use WebP format images
- Compress before uploading
- Keep images under 5MB

✅ **Faster Loading**
- Limit photos per page
- Use lazy loading (already enabled)
- Optimize JavaScript bundles

✅ **Better SEO**
- Add meaningful descriptions
- Use relevant keywords
- Add location data to photos

---

## Deployment Checklist

Before going live:

- [ ] All photos uploaded and displaying
- [ ] Blog posts created
- [ ] Contact info updated
- [ ] Social links configured
- [ ] About page written
- [ ] Equipment list updated
- [ ] Domain name chosen
- [ ] Analytics ID set up
- [ ] Site tested on mobile
- [ ] All links working

---

## Need Help?

- **Docs**: See [README.md](./README.md)
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Code**: Check GitHub repos for Next.js and Tailwind docs
- **Support**: Contact the community on Discord/Twitter

---

**Ready to launch?** 🚀

1. `npm run dev` - Test locally
2. `npm run build` - Build for production
3. `vercel deploy` - Deploy to live!
