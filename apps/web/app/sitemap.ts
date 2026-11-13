import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://bayoucharity.org'

  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/boats`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/innisfree`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/gallery`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/volunteer`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/donate`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/guides/john-macmurray`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/events/bff-spring-fishing-rodeo-2026`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/data-deletion`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
