import type { PinCrop } from '@/lib/pin-crop';

export async function saveGalleryCrop(
  submissionId: string,
  crop: PinCrop,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch('/api/gallery-crop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId, crop }),
  });
  const result = await response.json().catch(() => null);
  if (!result || typeof result !== 'object' || !('ok' in result)) {
    return { ok: false, error: 'Could not save the crop.' };
  }
  return result as { ok: true } | { ok: false; error: string };
}
