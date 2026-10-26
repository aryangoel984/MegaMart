import type { MetadataRoute } from 'next';

const SITE_URL = 'https://mega-mart-one.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/orders', '/chat'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
