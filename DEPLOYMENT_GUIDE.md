# Kickin' Aces — Vercel Deployment Guide

## ✅ What You Have
- Complete React web app (teamapp.jsx)
- All dependencies (package.json)
- Build config (vite.config.js)
- HTML entry point (index.html)
- GitHub Actions auto-deploy (optional)

## 🚀 Deploy in 5 Minutes

### Step 1: Create a GitHub repo
```bash
# In a new folder locally
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kickin-aces.git
git push -u origin main
```

### Step 2: Sign up for Vercel (free)
1. Go to **vercel.com**
2. Click **Sign up** → choose **GitHub**
3. Authorize Vercel to access your GitHub repos

### Step 3: Deploy the repo
1. After signing in, click **Add New...** → **Project**
2. Select your `kickin-aces` repo
3. Vercel auto-detects it's a Vite React app
4. Click **Deploy**
5. **Wait 2–3 minutes** — your app will be live at a URL like `https://kickin-aces-xyz.vercel.app`

That's it! 🎉

---

## 🔗 Share Your App

Once deployed, give this URL to your team:
```
https://YOUR_VERCEL_URL
```

They can:
- Sign in / sign up
- Use all features
- Add to home screen (Safari: Share → Add to Home Screen)

---

## 🔄 Auto-Deploy with GitHub Actions (optional)

Every time you push code to `main`, Vercel auto-deploys:

1. Get your Vercel tokens:
   - Go to vercel.com → **Settings** → **Tokens**
   - Create a token, copy it
   - Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - Add secret: `VERCEL_TOKEN` = your token

2. Get your Org/Project IDs:
   - On Vercel dashboard, click your project
   - URL is like: `vercel.com/YOUR_ORG/kickin-aces?...`
   - In GitHub Secrets, add:
     - `VERCEL_ORG_ID` = your org ID
     - `VERCEL_PROJECT_ID` = project ID from Vercel dashboard

3. Push to GitHub — Vercel auto-deploys!

---

## 🛠️ Local Development

Before deploying, test locally:

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Make changes, save, see live reload.

---

## 📱 PWA Install (Optional)

To let users install as an app without App Store:

1. Add this to `index.html` in the `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Kickin' Aces">
```

2. Create `public/manifest.json`:
```json
{
  "name": "Kickin' Aces",
  "short_name": "Kickin' Aces",
  "description": "Team management app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111",
  "theme_color": "#F5A020",
  "scope": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Then users can:
- iOS Safari: Share → Add to Home Screen
- Android Chrome: Menu → Install app

---

## ❓ Troubleshooting

**"Module not found: @supabase/supabase-js"**
→ Run `npm install`

**"Port 3000 already in use"**
→ Kill the process or use `npm run dev -- --port 3001`

**"Vercel deploy failed"**
→ Check GitHub Actions log for build errors (usually missing env vars or syntax issues)

**Questions?**
→ Vercel docs: https://vercel.com/docs

---

## 🎯 Next Steps

1. **Share the live URL** with your team
2. **Test all features** — sign up, chat, store, schedule sync
3. **Collect feedback** and iterate
4. **When stable** → consider native iOS (Capacitor + App Store)

Good luck! 🚀
