/**
 * Cryptographic PIN utilities using standard Web Crypto API (SHA-256)
 */

export async function hashPin(pin) {
  const subtle = (typeof window !== 'undefined' && window.crypto?.subtle)
    ? window.crypto.subtle
    : (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle)
      ? globalThis.crypto.subtle
      : null;

  if (!subtle) {
    throw new Error('Web Crypto API is not available in this environment.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin));
  const hashBuffer = await subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin, storedHash) {
  if (!pin || !storedHash) return false;
  const hash = await hashPin(pin);
  return hash === storedHash;
}
