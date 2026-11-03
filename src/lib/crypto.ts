/**
 * Zero-Knowledge Client-Side End-to-End Encryption (E2EE)
 * Using standard Web Crypto API (AES-GCM 256-bit with PBKDF2-HMAC-SHA256)
 */

export interface EncryptedPayload {
  version: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const ITERATIONS = 150000;

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a passphrase and salt
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts arbitrary text or serialized JSON object using AES-GCM 256
 */
export async function encryptData(plainText: string, passphrase: string): Promise<EncryptedPayload> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    enc.encode(plainText)
  );

  return {
    version: 1,
    salt: bufferToHex(salt),
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(ciphertext),
  };
}

/**
 * Decrypts an EncryptedPayload using the user passphrase
 */
export async function decryptData(payload: EncryptedPayload, passphrase: string): Promise<string> {
  const dec = new TextDecoder();
  const salt = hexToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    ciphertext as unknown as BufferSource
  );

  return dec.decode(decrypted);
}

/**
 * Quick hash verification for PIN/passphrase validation
 */
export async function hashVerification(text: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = hexToBuffer(saltHex);
  const key = await deriveKey(text, salt);
  const rawKey = await crypto.subtle.exportKey('raw', key).catch(() => null);
  if (rawKey) {
    return bufferToHex(rawKey);
  }
  // Fallback digest
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text + saltHex));
  return bufferToHex(digest);
}
