# Architecture & Components Guide

## Component Structure

### Layout Components
Located in `components/layout/`

#### Navbar
- Responsive navigation bar
- Mobile hamburger menu
- Logo/branding
- Links to all main pages
- Sticky positioning with backdrop blur

**Key Props**: None (uses internal state)

**Features**:
- Mobile-responsive
- Smooth animations
- Active link styling
- Navigation state management

#### Footer
- Copyright information
- Quick links
- Social media links
- Newsletter signup section
- Located at bottom of every page

**Key Props**: None (uses internal state)

**Features**:
- Responsive grid layout
- Hover effects on links
- Brand information
- Service listing

#### Layout
- Wrapper component
- Combines Navbar and Footer
- Child pages go in middle section

### Home Page Components
Located in `components/home/`

#### HeroSlideshow
- Fullscreen background slideshow
- Auto-rotating featured photos
- Manual navigation with dots
- Animated content overlay

**Props**:
```typescript
interface HeroSlideshowProps {
  // No props - uses data from portfolio.ts
}
```

**Features**:
- Auto-advance every 5 seconds
- Manual dot navigation
- Smooth transitions
- Scroll indicator animation
- Directional slide animation

#### FeaturedPhotos
- Grid showcase of featured images
- 3-column responsive layout
- Hover overlays with titles
- Links to detail pages
- Staggered animations

**Props**:
```typescript
interface FeaturedPhotosProps {
  // No props - uses data from portfolio.ts
}
```

**Features**:
- Masonry-style layout
- Hover scale effects
- Responsive sizing
- Category tags

#### Categories
- Photography category showcase
- Grid of 4 category cards
- Hover effects
- Brief descriptions

**Props**:
```typescript
interface CategoriesProps {
  // No props - uses hardcoded categories
}
```

**Features**:
- 2-column grid on desktop
- Hover animations
- Icon support

#### PhotographerBio
- Two-column layout
- Text on left, image on right
- "About" section preview
- CTA button to full about page

**Props**:
```typescript
interface PhotographerBioProps {
  // No props - hardcoded content
}
```

**Features**:
- Responsive columns
- Image with border radius
- Staggered animations

### Gallery Components
Located in `components/gallery/`

#### PhotoGrid
- Masonry grid layout
- Responsive sizing
- Hover effects
- Links to detail pages

**Props**:
```typescript
interface PhotoGridProps {
  photos: Photo[];
}
```

**Features**:
- Dynamic sizing (some photos larger)
- Smooth hover scale
- Auto-detection of image dimensions
- Responsive to screen size
- Staggered entrance animation

#### CategoryFilter
- Button group for filtering
- Active state styling
- Category selection

**Props**:
```typescript
interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}
```

**Features**:
- Active state highlighting
- Click handlers
- Animated pill buttons
- Smooth transitions

#### PhotoDetail
- Large image display
- EXIF metadata table
- Photo description
- Location information
- Social share buttons
- Camera settings display

**Props**:
```typescript
interface PhotoDetailProps {
  photo: Photo;
  onClose?: () => void;
}
```

**Features**:
- Image lazy loading
- Metadata formatting
- Share button styling
- Responsive layout

## Data Architecture

### Types (lib/types.ts)

#### Photo
```typescript
interface Photo {
  id: string;              // Unique identifier
  title: string;           // Photo title
  category: string;        // Category: wildlife, astrophotography, landscape, travel
  image: string;           // Full-size image URL
  thumbnail: string;       // Thumbnail URL
  description: string;     // Photo description
  location?: string;       // Location name
  camera?: string;         // Camera model
  lens?: string;           // Lens model
  iso?: number;            // ISO setting
  shutterSpeed?: string;   // Shutter speed (e.g., "1/500s")
  aperture?: string;       // Aperture (e.g., "f/2.8")
  focalLength?: string;    // Focal length (e.g., "200mm")
  featured: boolean;       // Show on home page
  date: string;            // Date taken (YYYY-MM-DD)
}
```

#### BlogPost
```typescript
interface BlogPost {
  id: string;              // Unique identifier
  slug: string;            // URL-friendly slug
  title: string;           // Post title
  excerpt: string;         // Short description
  content: string;         // Full post content (markdown)
  author: string;          // Author name
  date: string;            // Publication date (YYYY-MM-DD)
  category: string;        // Post category
  image: string;           // Featured image
  readTime: number;        // Estimated read time in minutes
}
```

#### Equipment
```typescript
interface Equipment {
  id: string;              // Unique identifier
  name: string;            // Equipment name
  type: string;            // Type: camera, lens, accessory
  description: string;     // Equipment description
}
```

### Utility Functions (lib/utils.ts)

#### getPhotosByCategory
```typescript
getPhotosByCategory(photos: Photo[], category: string): Photo[]
```
Filters photos by category.

#### getFeaturedPhotos
```typescript
getFeaturedPhotos(photos: Photo[]): Photo[]
```
Returns all featured photos.

#### getPhotoById
```typescript
getPhotoById(photos: Photo[], id: string): Photo | undefined
```
Finds a photo by ID.

#### formatDate
```typescript
formatDate(dateString: string): string
```
Formats date string (e.g., "March 1, 2024").

#### generateSitemap
```typescript
generateSitemap(baseUrl: string): string
```
Generates XML sitemap.

## Page Routes

### App Router Structure

```
app/
├── layout.tsx              # Root layout (HTML, fonts, providers)
├── page.tsx               # Home page (/)
├── error.tsx              # Error boundary
├── not-found.tsx          # 404 page
├── (pages)/               # Grouped routes
│   ├── gallery/
│   │   ├── page.tsx       # Gallery page (/gallery)
│   │   └── [id]/
│   │       └── page.tsx   # Photo detail (/gallery/:id)
│   ├── about/
│   │   └── page.tsx       # About page (/about)
│   ├── blog/
│   │   ├── page.tsx       # Blog list (/blog)
│   │   └── [slug]/
│   │       └── page.tsx   # Blog post (/blog/:slug)
│   └── contact/
│       └── page.tsx       # Contact page (/contact)
├── api/
│   ├── contact/
│   │   └── route.ts       # Contact form API
│   ├── sitemap.xml/
│   │   └── route.ts       # Sitemap route
│   └── robots.txt/
│       └── route.ts       # Robots.txt route
```

## Styling System

### Tailwind Configuration
- Dark theme (`bg-dark: #0a0a0a`)
- Accent color (`accent-gold: #d4af37`)
- Custom animations (fadeIn, slideUp, slideDown)
- Extended typography with serif fonts

### Global Styles (styles/globals.css)
- Font imports
- Tailwind directives
- Custom button styles
- Form input styling
- Scrollbar customization
- Typography defaults
- Animation keyframes

## Animation Patterns

### Framer Motion Usage

#### Page Entrance
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

#### Staggered Children
```typescript
variants={containerVariants}
// Children animate with delay
```

#### Hover Effects
```typescript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.95 }}
```

#### Viewport Animations
```typescript
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true, margin: '-100px' }}
```

## API Routes

### Contact Form
**Endpoint**: `POST /api/contact`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Hi Ahmed",
  "message": "Love your work!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

## Environment Variables

### Public Variables (Client-side)
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `NEXT_PUBLIC_CONTACT_EMAIL` - Contact email

### Server Variables (API-only)
- Email service credentials (optional)

## Performance Optimization

### Image Optimization
- Next.js Image component
- Automatic WebP/AVIF conversion
- Lazy loading
- Responsive sizes

### Code Splitting
- Route-based chunks
- Dynamic imports (if needed)
- Automatic in Next.js 14

### Caching
- Static generation
- ISR (Incremental Static Regeneration)
- Image caching headers

## Testing Recommendations

### Unit Tests
- Utility functions
- Component rendering

### Integration Tests
- Page routing
- API endpoints
- Data filtering

### E2E Tests
- Gallery navigation
- Contact form submission
- Blog post viewing

## Deployment Considerations

### Required
- Node.js 18+
- npm or yarn

### Recommended
- Vercel (built for Next.js)
- Custom domain
- SSL certificate (provided by Vercel)
- GitHub integration

### Optional
- Google Analytics setup
- Email service integration
- CDN for image optimization

---

This architecture provides a scalable, maintainable foundation for a professional photography portfolio!
