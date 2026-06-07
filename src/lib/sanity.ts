import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset:   import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-06-07',
  useCdn: false, // false = always fresh content (correct for on-demand rendering)
});

// Image URL builder — use in templates like: urlFor(image).width(800).url()
const builder = imageUrlBuilder(client);
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

// Typed GROQ fetch helper
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  return client.fetch<T>(query, params);
}
