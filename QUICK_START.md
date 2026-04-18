# Kickin' Aces — Complete Deployment Package

## 📦 Files You Have

All files are in `/mnt/user-data/outputs/`:

```
.
├── teamapp.jsx              ← Main React component (all features)
├── App.jsx                  ← Wrapper that imports teamapp
├── main.jsx                 ← React DOM entry point
├── index.html               ← HTML page shell
├── vite.config.js           ← Build config
├── package.json             ← Dependencies
├── .gitignore               ← Git exclusions
├── .github/
│   └── workflows/
│       └── deploy.yml       ← Auto-deploy on GitHub push
├── DEPLOYMENT_GUIDE.md      ← Step-by-step Vercel setup
└── README.md                ← Project overview

```

## 🚀 Deploy in 3 Steps

### 1️⃣ Create a GitHub Repo (2 minutes)

```bash
# Create new repo on github.com

# Clone it locally
git clone https://github.com/YOUR_USERNAME/kickin-aces.git
cd kickin-aces

# Copy all files from /mnt/user-data/outputs/ into this folder
cp /mnt/user-data/outputs/* .
cp /mnt/user-data/outputs/.github . -r

# Push to GitHub
git add .
git commit -m "Initial commit: Kickin' Aces app"
git push -u origin main
```

### 2️⃣ Connect Vercel (1 minute)

1. Go to **vercel.com**
2. Sign up with GitHub (authorize access)
3. Click **Add New...** → **Project**
4. Select `kickin-aces` repo
5. Click **Deploy**

**Wait 2–3 minutes** for the build to finish.

### 3️⃣ Get Your Live URL (instant)

Vercel gives you a URL like:
```
https://kickin-aces-abc123.vercel.app
```

**Share this with your team!** They can:
- Sign up / Sign in
- RSVP to games
- Use the live scoreboard
- Chat in real-time
- Buy from the store
- View schedule/standings

---

## 🔗 Key URLs You Need

| Purpose | URL |
|---------|-----|
| **Live App** | `https://YOUR_VERCEL_URL` |
| **Public Share Link** | `https://YOUR_VERCEL_URL?share=0def56e81d99` |
| **Backend** | `https://gujmmtjyinvpsqdgrrfz.supabase.co` |
| **Supabase Credentials** | See below |

---

## 🔐 Credentials (Save These!)

**Supabase Project**: `gujmmtjyinvpsqdgrrfz`
**Team ID**: `00000000-0000-0000-0000-000000000001`
**Anon Key**: `sb_publishable_O1rQlZgl5AQ7nlRBFHC19Q_p5xcQ5fX`

### Existing Data in Database
- ✅ 25 games (from TeamSideline)
- ✅ 7 league standings
- ✅ 5 store products
- ✅ RLS policies (role-based access)
- ✅ 3 edge functions (league-sync, square-checkout, square-webhook)

**No additional setup needed** — the backend is production-ready.

---

## 💳 To Enable Square Payments (Optional)

1. Create a Square account at **squareup.com**
2. Get your **Application ID** and **Location ID** from the dashboard
3. In Supabase Console:
   - Go to **Edge Functions** → **Secrets**
   - Add these:
     ```
     SQUARE_ACCESS_TOKEN=your_token
     SQUARE_LOCATION_ID=your_location_id
     SQUARE_ENV=sandbox
     ```
4. In Square Dashboard:
   - **Webhooks** → Add endpoint:
     ```
     https://gujmmtjyinvpsqdgrrfz.supabase.co/functions/v1/square-webhook
     ```
   - Subscribe to: `payment.updated`, `order.updated`

Until you do this, the store still works — orders save as "pending" and you can fulfill manually.

---

## 🛠️ Local Development (Before Deploying)

Test locally first:

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

Changes auto-reload. When ready to push:

```bash
git add .
git commit -m "your message"
git push origin main
# Vercel auto-deploys!
```

---

## 📱 Features Ready to Use

### All Working Now ✅
- Sign up / Sign in with email
- 4 user roles (admin, coach, player, guest)
- Real-time chat
- RSVP system
- Live scoreboard
- Store with cart
- Schedule (25 games + standings)
- Roster management
- Public guest view link

### Optional (Requires Square Setup)
- Squad payments (currently saves pending orders)

---

## 🎯 Next Steps

1. **Create GitHub repo** with all these files
2. **Deploy to Vercel** (click 1 button)
3. **Share URL with your team** — they sign up and start using it
4. **(Optional) Add Square credentials** when you're ready to process real payments
5. **(Optional) Convert to iOS app** with Capacitor when you want App Store presence

---

## ❓ Troubleshooting

**"npm install fails"**
→ Make sure you have Node 18+ (`node --version`)

**"Vercel deploy fails"**
→ Check the build log — usually missing files or syntax error

**"App won't load"**
→ Open browser console (F12) and check for errors

**"Real-time chat not working"**
→ Make sure you're signed in and team_id is correct in code

**"Store checkout not working"**
→ Square is in demo mode (no real payments) — see Square setup above

---

## 📞 Support

- **Vite docs**: https://vitejs.dev
- **React docs**: https://react.dev
- **Supabase docs**: https://supabase.com/docs
- **Vercel docs**: https://vercel.com/docs
- **Square docs**: https://developer.squareup.com

---

## 🎉 You're All Set!

Everything is production-ready. Your team can use this app starting **today** as a web app. 

Good luck! 🚀
