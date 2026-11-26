import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/members/', '/auth/', '/sign-in', '/preview/'],
    },
    sitemap: 'https://bayoucharity.org/sitemap.xml',
  }
}
