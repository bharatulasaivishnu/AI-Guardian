# AI Guardian

An all-in-one AI safety platform for individuals, students, and families. AI Guardian brings scam detection, personal emergency tools, campus safety, and family education together in one secure, accessible dashboard.

## Features

### Cybersecurity Guardian
- **Message & URL scam analysis** with two modes:
  - **Rule-based pattern detection** — runs locally in the browser, no server needed
  - **AI analysis** — real OpenAI-powered assessment via a secure Supabase Edge Function
- **Live URL reputation checks** via Google Safe Browsing API
- Analysis history saved to your account
- Built-in calibration self-test suite

### Personal Safety Guardian
- SOS interface with trusted emergency contacts
- Emergency action checklist
- Trusted contacts synced to your account

### Student Safety Guardian
- Campus emergency contacts directory (sample data included)
- Incident reporting with category, urgency, and location
- Campus safety checklist

### Family Guardian
- Age-appropriate online safety education (kids, teens, parents)
- Family digital safety checklist with server-side progress sync
- Topics: phishing, cyberbullying, privacy, suspicious contact

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + Lucide icons
- **Backend:** Supabase (Postgres database, Auth, Edge Functions)
- **AI:** OpenAI GPT-4o-mini for scam analysis
- **Threat Intelligence:** Google Safe Browsing API for URL reputation

## Architecture

```
src/
  components/     # UI views (CyberGuardian, PersonalSafety, StudentSafety, FamilyGuardian, etc.)
  lib/            # Logic (analysis, AI integration, auth, database, URL reputation)
  types.ts        # Shared TypeScript types

supabase/
  functions/      # Edge Functions (ai-analyze, url-reputation)
  migrations/     # SQL migrations with RLS policies
  config.toml     # Supabase configuration
```

## Security

- **Row Level Security** on every database table with ownership-scoped policies
- **Server-side validation** via CHECK constraints (phone format, text length, enum values)
- **No secrets in client code** — API keys live only as Supabase server secrets
- **JWT-protected Edge Functions** with CORS headers
- **200-row-per-user storage cap** enforced by database trigger
- All user data (contacts, reports, analysis history) is private per account

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Configuration

### Enable AI Analysis
Add an OpenAI API key as a Supabase secret named `OPENAI_API_KEY`.

### Enable URL Reputation
Add a Google Safe Browsing API key as a Supabase secret named `SAFE_BROWSING_API_KEY`.

Both features gracefully degrade — if a key is absent, the app shows an honest "not configured" message rather than faking a response.

## Running Tests

```bash
npm test        # run once
npm run test:watch  # watch mode
```

## Important Notes

- Risk assessments can be incorrect. Treat results as guidance, not verdicts.
- The SOS interface does not automatically contact anyone — delivery is never faked.
- Campus contacts use clearly labeled sample data until replaced with real numbers.
- This tool is not a substitute for professional emergency services.

## License

Educational project. Use at your own discretion.
