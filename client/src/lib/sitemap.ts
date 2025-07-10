import { generateProductUrl, generateCategoryUrl } from './utils';

export interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface Product {
  id: number;
  name: string;
  updatedAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  updatedAt?: string;
}

export function generateSitemap(
  baseUrl: string,
  products: Product[] = [],
  categories: Category[] = []
): string {
  const urls: SitemapUrl[] = [
    // Static pages
    { url: `${baseUrl}/`, priority: 1.0, changefreq: 'daily' },
    { url: `${baseUrl}/home`, priority: 1.0, changefreq: 'daily' },
    { url: `${baseUrl}/shop`, priority: 0.9, changefreq: 'daily' },
    { url: `${baseUrl}/contact`, priority: 0.7, changefreq: 'monthly' },
    { url: `${baseUrl}/shipping`, priority: 0.6, changefreq: 'monthly' },
    { url: `${baseUrl}/faq`, priority: 0.6, changefreq: 'monthly' },
    { url: `${baseUrl}/terms`, priority: 0.3, changefreq: 'yearly' },
    { url: `${baseUrl}/privacy`, priority: 0.3, changefreq: 'yearly' },
  ];

  // Add category pages
  categories.forEach(category => {
    urls.push({
      url: `${baseUrl}${generateCategoryUrl(category)}`,
      priority: 0.8,
      changefreq: 'weekly',
      lastmod: category.updatedAt
    });
  });

  // Add product pages
  products.forEach(product => {
    urls.push({
      url: `${baseUrl}${generateProductUrl(product)}`,
      priority: 0.9,
      changefreq: 'weekly',
      lastmod: product.updatedAt
    });
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.url}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

export function generateRobotsTxt(baseUrl: string): string {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Disallow admin and private areas
Disallow: /admin/
Disallow: /admin-setup/
Disallow: /debug/
Disallow: /signup-test/

# Allow important pages
Allow: /shop/
Allow: /product/
Allow: /contact/
Allow: /shipping/
Allow: /faq/
Allow: /terms/
Allow: /privacy/

# Crawl delay (optional)
Crawl-delay: 1`;
} 