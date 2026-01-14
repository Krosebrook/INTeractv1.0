# ⚡ Quick Deployment Checklist - INTeract Platform

**5-Minute Vercel Deployment from GitHub**

---

## ✅ Pre-Flight Check (Do This First)

```bash
# 1. Rename _gitignore to .gitignore
mv _gitignore .gitignore

# 2. Verify these files exist in your project root:
ls -la vercel.json .env.example .gitignore

# 3. Test build locally
npm install
npm run build
# Should create dist/ folder with no errors

# 4. Push to GitHub
git add .
git commit -m "Add Vercel deployment config"
git push origin main
```

---

## 🚀 Vercel Setup (3 Steps)

### Step 1: Import Project
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"  
3. Import your GitHub repository

### Step 2: Configure Build
```
Framework: Vite (auto-detected)
Build Command: npm run build
Output Directory: dist
Root Directory: ./
```

### Step 3: Environment Variables

**CRITICAL:** All variables MUST start with `VITE_`

Add these in Vercel → Settings → Environment Variables:

**For Base44:**
```
VITE_BASE44_API_KEY=your_key_here
VITE_BASE44_API_URL=https://api.base44.com
```

**For Firebase (when migrating):**
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender_id
VITE_FIREBASE_APP_ID=app_id
```

**Set for:** Production, Preview, Development (check all 3)

---

## 🎯 Deploy

Click "Deploy" → Wait 2-3 minutes → Done!

Your app will be live at: `your-app-name.vercel.app`

---

## 🐛 If Something Goes Wrong

### Build Fails?
```bash
# Test locally first
npm run build

# Check package.json has:
"scripts": {
  "build": "vite build"
}
```

### 404 on Routes?
Ensure `vercel.json` exists:
```json
{
  "rewrites": [{"source": "/(.*)", "destination": "/index.html"}]
}
```

### Environment Variables Not Working?
1. ✓ Prefix with `VITE_` in Vercel dashboard
2. ✓ Use `import.meta.env.VITE_YOUR_VAR` in code
3. ✓ Redeploy after adding variables

---

## 📋 Post-Deployment Tests

```bash
# 1. Visit your app
open https://your-app.vercel.app

# 2. Test these:
# ✓ Homepage loads
# ✓ Navigate to /dashboard (or any route)
# ✓ Refresh page (should not 404)
# ✓ Check browser console (no errors)
# ✓ API calls work (Firebase/Base44)
```

---

## 🔄 Auto-Deploy

Vercel now watches your repo:
- Push to `main` → Production deploy
- Open PR → Preview deploy (unique URL)
- Push to branch → Development deploy

---

## 🎉 Done!

Your app is live and auto-deploys on every push to GitHub.

**Need more details?** See VERCEL-DEPLOYMENT-GUIDE.md

---

**Files Created:**
- `vercel.json` - SPA routing config
- `.env.example` - Environment variable template  
- `.gitignore` - Updated to exclude .env files

**Resources:**
- Vercel Dashboard: https://vercel.com/dashboard
- Vite Docs: https://vite.dev/guide/static-deploy
- Vercel + Vite: https://vercel.com/docs/frameworks/vite

---

© 2026 INTeract Platform
