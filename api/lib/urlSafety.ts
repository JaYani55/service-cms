const METADATA_HOSTS = new Set([
  'metadata.google.internal',
  'metadata.google.internal.',
]);

function isIpv4Private(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }

  const [first, second] = parts;

  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
    || (first === 100 && second >= 64 && second <= 127);
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return normalized === 'localhost'
    || normalized.endsWith('.localhost')
    || normalized.endsWith('.local')
    || METADATA_HOSTS.has(normalized)
    || normalized === '::1'
    || normalized.startsWith('fe80:')
    || normalized.startsWith('fc')
    || normalized.startsWith('fd')
    || isIpv4Private(normalized);
}

export function validateOutboundHttpUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Invalid URL.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http and https URLs are allowed.' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Credentials in URLs are not allowed.' };
  }

  if (!parsed.hostname || isBlockedHostname(parsed.hostname)) {
    return { ok: false, error: 'Private, local, or metadata network targets are not allowed.' };
  }

  if (!parsed.hostname.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname)) {
    return { ok: false, error: 'Single-label hostnames are not allowed.' };
  }

  return { ok: true, url: parsed };
}