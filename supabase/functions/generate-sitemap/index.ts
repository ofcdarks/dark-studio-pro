const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEORoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

const BASE_URL = 'https://canaisdarks.com.br';
const today = new Date().toISOString().split('T')[0];

// Public routes configuration - keep in sync with src/lib/seoRoutes.ts
const publicRoutes: SEORoute[] = [
  { path: '/', changefreq: 'weekly', priority: 1.0, lastmod: today },
  { path: '/landing', changefreq: 'weekly', priority: 1.0, lastmod: today },
  { path: '/auth', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog', changefreq: 'daily', priority: 0.9, lastmod: today },
  // Blog Articles
  { path: '/blog/como-ganhar-dinheiro-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/nichos-lucrativos-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/como-criar-canal-dark', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/shorts-virais', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/roteiros-virais-ia', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/thumbnails-profissionais', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/seo-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/algoritmo-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/ferramentas-criacao-videos', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/monetizacao-afiliados', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/crescimento-rapido', changefreq: 'monthly', priority: 0.8, lastmod: today },
  // Utility & Legal
  { path: '/reset-password', changefreq: 'yearly', priority: 0.3, lastmod: today },
  { path: '/terms', changefreq: 'yearly', priority: 0.4, lastmod: today },
  { path: '/privacy', changefreq: 'yearly', priority: 0.4, lastmod: today },
];

const generateSitemapXML = (routes: SEORoute[], baseUrl: string): string => {
  const urlEntries = routes
    .map(
      (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sitemap = generateSitemapXML(publicRoutes, BASE_URL);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
