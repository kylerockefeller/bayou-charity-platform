import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Public files the worker can fetch through the assets binding. The filesystem
// copies are the fallback for next dev, where that binding is not present.
const FILES = {
  logo: {
    publicPath: '/brand/bayou-charity-logo-light-text.png',
    file: new URL('../../public/brand/bayou-charity-logo-light-text.png', import.meta.url),
  },
  marsh: {
    publicPath: '/Photos/Skyline Marsh golden hue.jpg',
    file: new URL('../../public/Photos/Skyline Marsh golden hue.jpg', import.meta.url),
  },
  regular: {
    publicPath: '/brand/fonts/LiberationSans-Regular.ttf',
    file: new URL('./fonts/LiberationSans-Regular.ttf', import.meta.url),
  },
  bold: {
    publicPath: '/brand/fonts/LiberationSans-Bold.ttf',
    file: new URL('./fonts/LiberationSans-Bold.ttf', import.meta.url),
  },
  forecastStory: {
    publicPath: '/preview/thanksgiving-forecast-1080x1350.jpg',
    file: new URL('../../public/preview/thanksgiving-forecast-1080x1350.jpg', import.meta.url),
  },
  forecastOg: {
    publicPath: '/preview/thanksgiving-forecast-1200x630.jpg',
    file: new URL('../../public/preview/thanksgiving-forecast-1200x630.jpg', import.meta.url),
  },
} as const;

export type BundledAsset = keyof typeof FILES;

function assetRequest(publicPath: string): Request {
  const path = publicPath.split('/').map((part, index) => (index === 0 ? part : encodeURIComponent(part))).join('/');
  return new Request(`https://assets.local${path}`);
}

async function fromAssets(name: string, publicPath: string): Promise<Uint8Array | null> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = await getCloudflareContext({ async: true });
    const assets = env.ASSETS;
    if (!assets) return null;
    const response = await assets.fetch(assetRequest(publicPath));
    if (!response.ok) throw new Error(`asset ${name} status ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('asset ')) throw error;
    return null;
  }
}

async function fromDisk(file: URL): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(fileURLToPath(file)));
  } catch {
    return null;
  }
}

export async function readBundledAsset(name: BundledAsset): Promise<Uint8Array> {
  const spec = FILES[name];
  const bytes = (await fromAssets(name, spec.publicPath)) ?? (await fromDisk(spec.file));
  if (!bytes) throw new Error(`Missing artwork asset: ${name}`);
  return bytes;
}
