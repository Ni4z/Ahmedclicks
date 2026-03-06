# Deployment Guide - Ahmed Photography Portfolio

## Table of Contents
1. [Quick Start with Vercel](#quick-start-with-vercel)
2. [Environment Setup](#environment-setup)
3. [Domain Configuration](#domain-configuration)
4. [Continuous Deployment](#continuous-deployment)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start with Vercel

### Prerequisites
- GitHub, GitLab, or Bitbucket account
- Project pushed to a Git repository

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up using your GitHub/GitLab/Bitbucket account
3. Authorize Vercel to access your repositories

### Step 2: Import Project
1. Click "New Project"
2. Select your repository containing the photography portfolio
3. Vercel auto-detects Next.js configuration
4. Click "Deploy"

**Deployment takes 2-5 minutes**

### Step 3: Access Your Site
Your site is now live at:
```
https://[your-project-name].vercel.app
```

---

## Environment Setup

### Local Development Environment Variables

Create `.env.local` file:

```env
# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Email Service (optional, for contact form)
NEXT_PUBLIC_CONTACT_EMAIL=hello@ahmedphotography.com
```

### Vercel Environment Variables

1. **Navigate to Project Settings**
   - Go to your Vercel dashboard
   - Select your project
   - Click "Settings"

2. **Add Environment Variables**
   - Click "Environment Variables"
   - Add variables for each environment (Development, Preview, Production)

3. **For Production:**
   ```
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

4. **Redeploy** after adding variables
   - Environment changes require redeployment
   - Latest deployment uses new variables

---

## Domain Configuration

### Connect Custom Domain

#### Step 1: Purchase Domain
Choose a domain registrar:
- Namecheap
- GoDaddy
- Google Domains
- Vercel (direct purchase available)

#### Step 2: Configure in Vercel

1. Open your Vercel project
2. Go to "Settings" → "Domains"
3. Enter your domain (e.g., `ahmedphotography.com`)
4. Click "Add"

#### Step 3: Update DNS Records

**Option A: Vercel Nameservers (Recommended)**

1. Vercel provides 2 nameservers
2. Add them to your domain registrar's DNS settings
3. Can take up to 48 hours to propagate

Example:
```
Type: Nameserver
Value: ns1.vercel-dns.com
Value: ns2.vercel-dns.com
```

**Option B: CNAME Record (If keeping registrar nameservers)**

1. In domain registrar, add:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

2. Add A records:
```
Type: A
Name: @
Value: 76.76.19.132
```

### Add WWW Subdomain

1. Vercel dashboard → Domains
2. Add `www.ahmedphotography.com`
3. Vercel automatically redirects `www` to root domain

### SSL Certificate

✅ **Automatic** - Vercel provides free SSL for all domains
- Covers both domain and www subdomain
- Auto-renews 30 days before expiration

---

## Continuous Deployment

### Git Workflow

Every push to your main branch triggers automatic deployment:

```bash
# Make changes
git add .
git commit -m "Update photos"
git push origin main

# Automatically deploys to production in ~2-5 minutes
```

### Preview Deployments

Push to feature branches for preview URLs:

```bash
# Create feature branch
git checkout -b update-gallery

# Make changes and push
git push origin update-gallery

# Creates preview deployment at:
# https://update-gallery.your-project.vercel.app
```

### Deploy Environment Control

**Production** - Deploys from `main` branch
**Preview** - Deploys from all other branches

Change settings:
1. Vercel Dashboard → Settings → Git
2. Configure production branch
3. Enable/disable preview deployments

---

## Monitoring & Analytics

### Vercel Analytics

1. **Enable Analytics**
   - Project Settings → Analytics
   - Toggle "Enable Analytics"

2. **View Metrics**
   - Dashboard → Analytics
   - Monitor:
     - Page load times
     - Request count
     - Bandwidth usage
     - Error rates

### Google Analytics

1. **Setup Google Analytics 4**
   - Go to [analytics.google.com](https://analytics.google.com)
   - Create new property
   - Get tracking ID (format: `G-XXXXXXXXXX`)

2. **Add to Vercel Environment**
   - Settings → Environment Variables
   - Add: `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX`

3. **Redeploy**
   - Analytics starts tracking after redeployment

### Monitoring Uptime

Services to monitor your site:
- **Uptime Robot** - Free tier available
- **Pingdom** - Monitor availability
- **StatusPage** - Show status to visitors

---

## Troubleshooting

### Common Deployment Issues

#### 1. Build Fails
**Error**: `npm run build` fails

**Solutions**:
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check Node version compatibility
node --version  # Should be 18+
```

#### 2. Image Optimization Fails
**Error**: Images don't load on deployed site

**Solutions**:
- Ensure all image URLs are absolute (include domain)
- Check CORS headers if using external images
- Verify image dimensions are reasonable

#### 3. Environment Variables Not Working
**Error**: `process.env.VARIABLE` is undefined

**Solutions**:
- Only use `NEXT_PUBLIC_` prefix for client-side variables
- Redeploy after adding environment variables
- Manually trigger redeployment: Deployments → Redeploy

#### 4. Custom Domain Not Working
**Error**: Domain shows Vercel 404 page

**Solutions**:
```bash
# Check DNS propagation (can take 48 hours)
dig yourdomain.com
nslookup yourdomain.com

# Verify in Vercel: Settings → Domains
# Should show "Valid Configuration"

# Clear browser cache and try incognito window
```

#### 5. Database/API Connection Issues
**Error**: Contact form fails to send

**Solutions**:
- Check that API route exists: `/app/api/contact/route.ts`
- Verify email service configuration
- Check Vercel logs: Deployments → Runtime Logs

#### 6. Build Timeout
**Error**: Build fails with timeout

**Solutions**:
- Check for large files or slow operations
- Optimize images before uploading
- Consider upgrading Vercel plan

### Viewing Deployment Logs

1. Vercel Dashboard → Deployments
2. Click on a deployment
3. View build logs and runtime logs
4. Search for errors or warnings

### Performance Issues

If your site is slow:

1. **Check Metrics**
   - Vercel Analytics
   - Google Analytics
   - Chrome DevTools

2. **Optimize Images**
   - Use WebP format
   - Compress before uploading
   - Use responsive sizes

3. **Enable Caching**
   - Already configured in Next.js
   - Check Cache-Control headers

4. **Contact Vercel Support**
   - If persistent issues
   - Vercel Pro includes priority support

---

## Maintenance

### Regular Updates

```bash
# Check for package updates
npm outdated

# Update packages (careful with major versions)
npm update

# Update specific package
npm install next@latest

# Test locally before deploying
npm run dev
npm run build
```

### Backup Your Data

1. Regular Git commits (backup automatically)
2. Export photos from data file
3. Backup environment variables locally (securely)

### Monitoring Updates

Subscribe to:
- Next.js updates: [nextjs.org/blog](https://nextjs.org/blog)
- Vercel announcements: [vercel.com/blog](https://vercel.com/blog)

---

## Production Checklist

- [ ] Domain configured and DNS resolved
- [ ] Environment variables set in Vercel
- [ ] Google Analytics ID configured
- [ ] Contact form email service working
- [ ] All images optimized
- [ ] Meta tags updated with your info
- [ ] Social links configured
- [ ] Performance metrics acceptable (Lighthouse 90+)
- [ ] Mobile responsive tested
- [ ] All links working (no 404s)
- [ ] SSL certificate valid
- [ ] Monitoring/analytics enabled
- [ ] Backups configured

---

## Support

For issues:
1. Check [Vercel Documentation](https://vercel.com/docs)
2. Search [GitHub Issues](https://github.com/vercel/next.js/issues)
3. Contact Vercel Support (Pro plans)
4. Consult Next.js documentation

---

**Deployment Complete!** Your photography portfolio is now live! 🎉
