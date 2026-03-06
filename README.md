# Ahmed Photography Portfolio

A modern, responsive photography portfolio website built with Next.js 14, React, Tailwind CSS, and Framer Motion.

## Features

✨ **Visual Excellence**
- Fullscreen hero slideshow with smooth animations
- Masonry grid gallery layout
- Stunning animations and micro-interactions
- Dark theme optimized for photography

📱 **Responsive Design**
- Mobile-first approach
- Seamless experience across all devices
- Touch-optimized navigation

⚡ **Performance**
- Next.js 14 App Router
- Image optimization with Next.js Image
- Fast loading times
- SEO optimized

🎨 **User Experience**
- Smooth page transitions
- Interactive hover effects
- Intuitive navigation
- Gallery filtering by category

📸 **Photography Features**
- Image gallery with categories (Wildlife, Astrophotography, Landscapes, Travel)
- Photo detail pages with EXIF data display
- Featured photo showcase
- Blog/Stories section for photography tips and travel narratives

🔍 **SEO & Analytics**
- Meta tags and OpenGraph support
- Sitemap generation
- robots.txt
- Google Analytics integration ready
- Structured data markup

## Tech Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **Fonts**: Google Fonts (Playfair Display, Inter)
- **Image Optimization**: Next.js Image
- **TypeScript**: Full type safety
- **Linting**: ESLint with Next.js config

## Project Structure

```
website/
├── app/
│   ├── (pages)/              # Page routes
│   │   ├── gallery/          # Gallery pages
│   │   ├── about/            # About page
│   │   ├── blog/             # Blog pages
│   │   └── contact/          # Contact page
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/
│   ├── layout/               # Layout components (Navbar, Footer)
│   ├── gallery/              # Gallery components
│   └── home/                 # Home page components
├── data/
│   └── portfolio.ts          # Sample photos and blog data
├── lib/
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
├── public/
│   ├── images/               # Image assets
│   └── favicon.ico           # Favicon
├── styles/
│   └── globals.css           # Global styles
├── package.json              # Dependencies
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## Pages

### 1. **Home** (`/`)
- Fullscreen hero slideshow
- Featured photos showcase
- Photography categories overview
- Photographer bio section

### 2. **Gallery** (`/gallery`)
- Category filtering (All, Wildlife, Astrophotography, Landscapes, Travel)
- Masonry grid layout
- Click to view full details

### 3. **Photo Detail** (`/gallery/:id`)
- Large image display
- EXIF data (Camera, Lens, ISO, Shutter Speed, Aperture, Focal Length)
- Photo description and location
- Social share buttons
- Navigation to previous/next photo

### 4. **About** (`/about`)
- Photographer biography
- Equipment list
- Photography philosophy
- Professional journey

### 5. **Blog** (`/blog`)
- Featured articles about photography
- Category tags
- Read time estimates
- Newsletter signup

### 6. **Blog Post** (`/blog/:slug`)
- Full article content
- Author information
- Publication metadata

### 7. **Contact** (`/contact`)
- Contact form
- Social links
- Location information
- Services offered

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Step 1: Clone or Navigate to Project
```bash
cd website
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
# or with uv
uv pip install nodejs  # if nodejs not installed
npm install
```

### Step 3: Update Environment Variables
Create a `.env.local` file in the root directory (optional):
```env
# Google Analytics
NEXT_PUBLIC_GA_ID=your-ga-id

# Contact Form Email Service (optional)
NEXT_PUBLIC_CONTACT_EMAIL=hello@ahmedphotography.com
```

### Step 4: Update Site Information
Edit `app/layout.tsx` to update:
- Site title and description
- OpenGraph images
- Author information
- Google Analytics ID

Edit `data/portfolio.ts` to add your own:
- Photos
- Blog posts
- Equipment list

### Step 5: Development
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 6: Build for Production
```bash
npm run build
npm start
```

## Customization

### Adding Photos

Edit `data/portfolio.ts`:

```typescript
export const photos: Photo[] = [
  {
    id: '9',
    title: 'Photo Title',
    category: 'wildlife',  // wildlife, astrophotography, landscape, travel
    image: 'https://example.com/photo.jpg',
    thumbnail: 'https://example.com/thumbnail.jpg',
    description: 'Photo description',
    location: 'Location Name',
    camera: 'Canon EOS R5',
    lens: 'RF 100-500mm',
    iso: 1600,
    shutterSpeed: '1/500s',
    aperture: 'f/7.1',
    focalLength: '500mm',
    featured: true,
    date: '2024-03-01',
  },
  // ... more photos
];
```

### Adding Blog Posts

Edit `data/portfolio.ts`:

```typescript
export const blogPosts: BlogPost[] = [
  {
    id: '4',
    slug: 'my-new-article',
    title: 'Article Title',
    excerpt: 'Brief description',
    content: 'Full article content with markdown support',
    author: 'Ahmed',
    date: '2024-03-01',
    category: 'Photography Tips',
    image: 'https://example.com/photo.jpg',
    readTime: 8,
  },
  // ... more posts
];
```

### Customizing Colors

Edit `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      dark: '#000000',
      'accent-gold': '#FFD700', // Change accent color
      // ... more colors
    },
  },
}
```

### Adding Google Analytics

Edit `app/layout.tsx`:

```typescript
<script
  async
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
/>
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
    `,
  }}
/>
```

## Deployment

### Deploy to Vercel (Recommended)

Vercel is the creator of Next.js and offers the best deployment experience.

#### Option 1: Git Integration (Recommended)

1. Push your code to GitHub, GitLab, or Bitbucket
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your repository
5. Vercel will auto-detect Next.js settings
6. Click "Deploy"

#### Option 2: CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### Environment Variables on Vercel

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add your variables:
   - `NEXT_PUBLIC_GA_ID`: Your Google Analytics ID

### Custom Domain

1. Go to Vercel project settings
2. Select "Domains"
3. Add your custom domain
4. Follow DNS configuration steps

### Deploy to Other Platforms

#### Netlify

1. Connect your GitHub repository to Netlify
2. Build command: `npm run build`
3. Publish directory: `.next`

#### Docker (Self-hosted)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ahmed-photography .
docker run -p 3000:3000 ahmed-photography
```

## Performance Optimization

### Image Optimization
- Images are automatically optimized by Next.js
- WebP and AVIF formats are supported
- Lazy loading is enabled for off-screen images

### Code Splitting
- Automatic code splitting for routes
- Dynamic imports for heavy components

### Caching
- Static page generation where possible
- Image caching headers

## SEO Features

✅ **Meta Tags**
- Title and description
- OpenGraph tags
- Twitter Card
- Viewport and charset

✅ **Structured Data**
- Schema.org markup ready
- Image metadata

✅ **Auto-generated**
- `sitemap.xml` at `/sitemap.xml`
- `robots.txt` at `/robots.txt`

✅ **Analytics Ready**
- Google Analytics integration
- Event tracking setup

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Metrics

Target Web Vitals:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

## License

This project is open source and available under the MIT License.

## Support & Contact

For questions or support regarding the template:
- Email: hello@ahmedphotography.com
- Instagram: @ahmedphotography

## Future Enhancements

- [ ] Print shop integration (Stripe)
- [ ] Instagram feed integration
- [ ] Dark/Light theme toggle
- [ ] Photo download options
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Comments on blog posts
- [ ] Social login
- [ ] PWA support
- [ ] Mobile app version

## Contributing

If you find bugs or have suggestions, feel free to open an issue or submit a pull request.

---

**Ready to showcase your photography?** Update the content in `data/portfolio.ts` and deploy! 🚀
