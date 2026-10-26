import type { MetadataRoute } from 'next';

const SITE_URL = 'https://mega-mart-one.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/products', '/search', '/login', '/register'];
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));
}
