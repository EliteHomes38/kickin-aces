# Kickin' Aces — Sports Team Management App

Live, fully-functional web app for sports team management with real-time chat, schedule/standings sync from league websites, team store with Square payments, and role-based access (admin, coach, player, guest).

## 🚀 Quick Start

### Deploy to Vercel (1 click)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repo → Deploy
4. Share the live URL with your team

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed steps.

## 🏗️ Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Realtime)
- **Payments**: Square (checkout API)
- **Hosting**: Vercel (web) or Capacitor (iOS/Android native)

## 📱 Features

### Team Management
- ✅ Roster with positions, jersey numbers, availability
- ✅ Live standings & schedule synced from league websites
- ✅ RSVP system for games/practices
- ✅ Live scoreboard during games

### Communication
- ✅ Real-time team chat
- ✅ Event reminders
- ✅ Task assignments

### Store
- ✅ Team merchandise (jerseys, hats, stickers, etc.)
- ✅ Square checkout
- ✅ Order tracking

### Access Control
- **Admin**: Full control, manage team, approve orders
- **Coach**: Manage roster, set lineups, sync league data
- **Player**: RSVP, chat, shop, view schedule
- **Guest**: Public read-only view (via share link)

## 🔑 Environment Variables

Not needed for development (hardcoded for demo), but for production:

```env
VITE_SUPABASE_URL=https://gujmmtjyinvpsqdgrrfz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_O1rQlZgl5AQ7nlRBFHC19Q_p5xcQ5fX
```

For Square (set in Supabase Edge Function secrets):
```env
SQUARE_ACCESS_TOKEN=your_token
SQUARE_LOCATION_ID=your_location
SQUARE_ENV=sandbox  # or production
```

## 🛠️ Local Development

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## 🏗️ Build & Deploy

```bash
npm run build
# Uploads dist/ folder to Vercel automatically
```

## 🌐 Public Share Link

Anyone can view your team's schedule, roster, and store without signing up:
```
https://YOUR_VERCEL_URL?share=0def56e81d99
```

Customize the share code in Supabase → teams table.

## 📖 API Docs

All data syncs via Supabase Realtime. Edge Functions handle:
- `league-sync` — Scrapes TeamSideline/league website, updates schedule & standings
- `square-checkout` — Creates Square payment links
- `square-webhook` — Handles payment confirmations

## 🍎 iOS App Store

To convert to native iOS:
1. `npm install @capacitor/core @capacitor/ios`
2. `npx cap init && npx cap add ios`
3. `npm run build && npx cap sync`
4. `npx cap open ios` → Xcode → submit to App Store

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full instructions.

## 📄 License

MIT

## 💬 Questions?

Check the deployment guide or reach out!
