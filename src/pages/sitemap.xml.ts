import type { APIRoute } from 'astro';
import { sanityFetch } from '../lib/sanity';

export const GET: APIRoute = async () => {
  const base = 'https://hightidemarketing.com';
  const now = new Date().toISOString().split('T')[0];

  // Fetch all dynamic content from Sanity
  const [services, locations, localPages, caseStudies] = await Promise.all([
    sanityFetch<{ slug: string }[]>(
      `*[_type == "servicePage"]{ "slug": slug.current }`,
      {}
    ),
    sanityFetch<{ slug: string }[]>(
      `*[_type == "locationPage"]{ "slug": slug.current }`,
      {}
    ),
    sanityFetch<{ slug: string }[]>(
      `*[_type == "localServicePage"]{ "slug": slug.current }`,
      {}
    ),
    sanityFetch<{ slug: string }[]>(
      `*[_type == "caseStudy"]{ "slug": slug.current }`,
      {}
    ),
  ]);

  // Static pages
  const staticUrls = [
    { loc: base, priority: '1.0', changefreq: 'weekly' },
    { loc: `${base}/services`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${base}/locations`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${base}/work`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${base}/blog`, priority: '0.7', changefreq: 'weekly' },
    { loc: `${base}/privacy`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${base}/terms`, priority: '0.3', changefreq: 'yearly' },
  ];

  // Dynamic service pages (slug stored as services/video — URL is /services/video)
  const serviceUrls = (services ?? []).map(({ slug }) => ({
    loc: `${base}/${slug}`,
    priority: '0.9',
    changefreq: 'monthly',
  }));

  // Location pages
  const locationUrls = (locations ?? []).map(({ slug }) => ({
    loc: `${base}/locations/${slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  // Local SEO landing pages
  const localUrls = (localPages ?? []).map(({ slug }) => ({
    loc: `${base}/${slug}`,
    priority: '0.85',
    changefreq: 'monthly',
  }));

  // Case study pages
  const caseStudyUrls = (caseStudies ?? []).map(({ slug }) => ({
    loc: `${base}/work/${slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  const allUrls = [...staticUrls, ...serviceUrls, ...locationUrls, ...localUrls, ...caseStudyUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    ({ loc, priority, changefreq }) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
