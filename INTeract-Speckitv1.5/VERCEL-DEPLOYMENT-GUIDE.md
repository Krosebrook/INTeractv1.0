# INTeract Platform - Vercel Deployment Guide

**Complete guide for deploying your Vite + React + Firebase/Base44 app to Vercel via GitHub**

Generated: January 12, 2026  
Status: Production-Ready Configuration

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Your code pushed to a GitHub repository
- ✅ Firebase or Base44 API credentials ready

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Prepare Your Repository

**1.1 Ensure Required Files Exist**

Your project now has these deployment files:

```
/mnt/project/
├── vercel.json          ✓ Created (SPA routing config)
├── .env.example         ✓ Created (environment template)
├── _gitignore           ✓ Updated (excludes .env files)
├── vite_config.js       ✓ Exists
└── package.json         ✓ Exists
```

**1.2 Rename _gitignore to .gitignore**

```bash
# In your local project directory
mv _gitignore .gitignore
```

**1.3 Create Your Environment File Locally (Optional for testing)**

```bash
cp .env.example .env.local
# Edit .env.local with your actual API keys
```

**DO NOT commit .env.local** - it's already in .gitignore

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### Step 3: Deploy to Vercel

**3.1 Connect to Vercel**

1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Click "Import Git Repository"
4. Select your GitHub organization/account
5. Click "Import" next to your INTeract repository

**3.2 Configure Build Settings**

Vercel auto-detects Vite projects, but verify these settings:

```
Framework Preset: Vite
Build Command: npm run build  (or vite build)
Output Directory: dist
Install Command: npm install
```

**3.3 Configure Environment Variables**

Click "Environment Variables" and add your variables with the `VITE_` prefix:

**For Base44 SDK:**
```
Variable Name: VITE_BASE44_API_KEY
Value: your_actual_base44_api_key
Environments: Production, Preview, Development
```

**For Firebase (when migrating):**
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**IMPORTANT:** All environment variables **MUST** be prefixed with `VITE_` for Vite to expose them to the client-side code.

**3.4 Deploy**

Click "Deploy" and wait 2-3 minutes for the build to complete.

---

## 📁 Required Files Explained

### 1. `vercel.json` (✓ Created)

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Purpose:** 
- Enables client-side routing (React Router)
- Prevents 404 errors when refreshing on sub-routes
- All requests are redirected to index.html for SPA handling

**Without this:** Routes like `/dashboard` or `/surveys` will return 404 when refreshed.

### 2. `.env.example` (✓ Created)

Template for your environment variables. Shows what variables are needed without exposing actual values.

**Usage:**
```bash
cp .env.example .env.local
# Edit .env.local with real values
```

### 3. `.gitignore` Updates

```gitignore
# Environment variables
.env
.env.local
.env.production
.env.development
.env.*.local
```

**Purpose:** Prevents committing sensitive API keys to GitHub.

---

## 🔧 Environment Variables Deep Dive

### How Vite Environment Variables Work

**In Development (local):**
```javascript
// Vite reads from .env.local
const apiKey = import.meta.env.VITE_BASE44_API_KEY;
```

**In Production (Vercel):**
```javascript
// Vite reads from Vercel environment variables
const apiKey = import.meta.env.VITE_BASE44_API_KEY;
```

### Critical Rules

1. **MUST use `VITE_` prefix** - Only variables with this prefix are exposed to client
2. **Use `import.meta.env`** - NOT `process.env` (that's Node.js, not browser)
3. **Set in Vercel Dashboard** - For production builds
4. **Never commit .env files** - Use .env.example as template

### Example Firebase Config

```javascript
// src/config/firebase.js
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export default app;
```

---

## 🔄 Continuous Deployment

Once connected, Vercel automatically:

✅ **Every push to `main`** → Production deployment  
✅ **Every pull request** → Preview deployment (unique URL)  
✅ **Every branch push** → Development deployment

**Preview Deployments:**
- Each PR gets a unique URL: `your-app-git-branch-name.vercel.app`
- Perfect for testing before merging
- Automatically updated with new commits

---

## 🐛 Troubleshooting

### Issue 1: Environment Variables Not Working

**Symptoms:**
- App works locally but fails in production
- Firebase/API errors: "apiKey is undefined"

**Solution:**
```bash
# 1. Check variable names in Vercel dashboard
#    Must have VITE_ prefix: VITE_FIREBASE_API_KEY

# 2. Check your code uses import.meta.env
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY; // ✓ Correct
const apiKey = process.env.VITE_FIREBASE_API_KEY;      // ✗ Wrong

# 3. Redeploy after adding variables
#    Vercel > Deployments > [Latest] > Redeploy
```

### Issue 2: 404 on Page Refresh

**Symptoms:**
- Routes work when navigating within the app
- Refreshing `/dashboard` returns 404

**Solution:**
Ensure `vercel.json` exists with the rewrite rule (already created).

### Issue 3: Build Fails

**Check these:**

```bash
# 1. Build works locally?
npm run build

# 2. Check package.json scripts
"scripts": {
  "build": "vite build"  # Must exist
}

# 3. Check vite.config.js
# Should have:
build: {
  outDir: 'dist'  # Matches Vercel output directory
}
```

### Issue 4: Module Not Found Errors

**Solution:**
```bash
# Ensure all dependencies are in package.json
npm install --save missing-package

# Commit and push
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

---

## 📊 Vercel Dashboard Features

### Deployments Tab
- View all deployments (production, preview, development)
- Access deployment logs
- Rollback to previous deployments

### Settings Tab
- **Domains:** Add custom domain (e.g., interact.yourdomain.com)
- **Environment Variables:** Add/edit variables
- **Git:** Configure which branch is production
- **Functions:** Configure serverless functions (if needed)

### Analytics Tab
- Real Users Metrics
- Core Web Vitals
- Visitor insights

---

## 🚀 Post-Deployment Steps

### 1. Verify Deployment

Visit your Vercel URL: `your-app-name.vercel.app`

**Test checklist:**
- [ ] Homepage loads
- [ ] Navigation between routes works
- [ ] Refresh on sub-routes works (e.g., `/dashboard`)
- [ ] Firebase/Base44 API calls work
- [ ] No console errors

### 2. Set Up Custom Domain (Optional)

1. Go to Project → Settings → Domains
2. Add your domain: `interact.yourdomain.com`
3. Add DNS records at your registrar:
   ```
   Type: CNAME
   Name: interact
   Value: cname.vercel-dns.com
   ```
4. Wait for DNS propagation (5-60 minutes)

### 3. Configure Production Environment

```javascript
// Add environment detection
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Use different configs
const apiUrl = isProd 
  ? 'https://api.production.com' 
  : 'https://api.staging.com';
```

---

## 🔒 Security Best Practices

### 1. Firebase API Keys
Firebase API keys are **safe to expose** in client-side code. They identify your Firebase project but don't grant access. Security is handled by:
- Firestore Security Rules
- Firebase Authentication
- Firebase App Check

### 2. Base44 API Keys
If using Base44 SDK, ensure keys have proper scoping and rate limiting configured in Base44 dashboard.

### 3. Environment Variables
- ✅ Use VITE_ prefix for client-exposed variables
- ✅ Keep sensitive server-side keys in Vercel Functions (if needed)
- ✅ Rotate keys regularly
- ❌ Never commit .env files to Git

---

## 📈 Performance Optimization

### 1. Enable Vercel Analytics

```bash
npm install @vercel/analytics
```

```javascript
// src/main.jsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

### 2. Configure Build Optimizations

```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable in production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        }
      }
    }
  }
});
```

### 3. Enable Compression

Vercel automatically enables:
- Gzip compression
- Brotli compression (for modern browsers)
- HTTP/2 push

---

## 🔄 Rollback Procedure

If a deployment breaks production:

1. Go to Vercel → Deployments
2. Find the last working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback

**Or via CLI:**
```bash
npm i -g vercel
vercel rollback
```

---

## 📚 Additional Resources

### Official Documentation
- Vite: https://vite.dev/guide/static-deploy
- Vercel: https://vercel.com/docs
- Vercel + Vite: https://vercel.com/docs/frameworks/vite

### Common Issues
- Vite Environment Variables: https://vite.dev/guide/env-and-mode
- Vercel Environment Variables: https://vercel.com/docs/projects/environment-variables

---

## ✅ Deployment Checklist

Before going live, ensure:

- [ ] `vercel.json` exists in project root
- [ ] `.env.example` documents all required variables
- [ ] `.gitignore` excludes `.env*` files
- [ ] All environment variables set in Vercel dashboard with `VITE_` prefix
- [ ] Code pushed to GitHub
- [ ] Build succeeds locally: `npm run build`
- [ ] All routes tested after deployment
- [ ] Custom domain configured (if applicable)
- [ ] Analytics enabled (optional)
- [ ] SSL certificate active (automatic with Vercel)

---

## 🎯 Success Metrics

Your deployment is successful when:

✅ Build completes in 2-3 minutes  
✅ All routes load without 404 errors  
✅ Firebase/Base44 integration works  
✅ No console errors  
✅ Lighthouse score >90  
✅ First Contentful Paint <1.5s  

---

## 📞 Support

**Vercel Support:**
- Dashboard: https://vercel.com/help
- Community: https://github.com/vercel/community
- Discord: https://vercel.com/discord

**Firebase Support:**
- Documentation: https://firebase.google.com/docs
- Stack Overflow: [firebase] tag

**Base44 Support:**
- Email: app@base44.com

---

## 🎉 You're Ready to Deploy!

Your project is now fully configured for Vercel deployment. Follow the Quick Start steps above to go live in 5 minutes.

**Next Steps:**
1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

**Questions?** Refer to the Troubleshooting section or Vercel documentation.

---

© 2026 INTeract Platform  
Last Updated: January 12, 2026
