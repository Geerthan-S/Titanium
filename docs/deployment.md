# Deployment

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment environment, then run:

```text
npm ci
npm test
npm run build
```

Deploy the generated `dist/` directory with SPA-independent static routing for each HTML file. Configure Supabase Auth redirect allowlists for the deployed `/admin/reset-password.html` URL.

CMS content updates appear through public queries and Realtime. SEO metadata is embedded at build time, so configure a deployment hook after SEO records change.
