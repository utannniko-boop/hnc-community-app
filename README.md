# HNC Community PWA (v2)

## New features
- Automatic ClinicalTrials.gov fetch by cancer type
- Anonymous community posts using Supabase (+reports)

## Setup
1. Deploy to GitHub Pages
2. Edit `supabase-client.js` with your project URL and anon key
3. In Supabase SQL editor, run `supabase_schema.sql`
4. Use Service key (server/admin) to moderate: `update posts set hidden=true where id=?`

## Notes
- Do not share personal info. Not medical advice. Consult your physician.
