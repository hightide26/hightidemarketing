import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hightidemarketing.com',
  integrations: [sitemap()],
  // 'server' = on-demand rendering by default.
  // Any page can opt into static pre-rendering with: export const prerender = true
  output: 'server',
  adapter: vercel({
    isr: {
      // Cache rendered pages for 60s, then regenerate on next request.
      // Sanity webhook will purge cache instantly when content changes.
      expiration: 60,
    },
  }),
});
