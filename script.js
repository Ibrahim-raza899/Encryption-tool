const plainTextEl = document.getElementById('plainText');
const algorithmEl = document.getElementById('algorithm');
const keyGroupEl = document.getElementById('keyGroup');
const secretKeyEl = document.getElementById('secretKey');
const cipherTextEl = document.getElementById('cipherText');
const statusEl = document.getElementById('status');
const encryptBtn = document.getElementById('encryptBtn');
const decryptBtn = document.getElementById('decryptBtn');
const copyBtn = document.getElementById('copyBtn');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = isError ? 'error' : 'success';
}

function clearStatus() {
  statusEl.textContent = '';
  statusEl.className = '';
}

function validateInputs(isDecrypt = false) {
  const text = plainTextEl.value.trim();
  const algorithm = algorithmEl.value;

  if (!text) {
    setStatus('Please enter text first.', true);
    return null;
  }

  if (!algorithm) {
    setStatus('Please select an encryption method.', true);
    return null;
  }

  if (algorithm === 'aes' && !secretKeyEl.value.trim()) {
    setStatus('Please provide a secret key for AES.', true);
    return null;
  }

  if (isDecrypt && algorithm === 'sha256') {
    setStatus('SHA-256 is a one-way hash and cannot be decrypted.', true);
    return null;
  }

  return { text, algorithm, secretKey: secretKeyEl.value };
}

function normalizeShift(shift) {
  const normalized = shift % 26;
  return normalized < 0 ? normalized + 26 : normalized;
}

function caesarCipher(text, shift = 3) {
  const safeShift = normalizeShift(shift);
  return text.replace(/[a-z]/gi, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + safeShift) % 26) + base);
  });
}

function caesarDecrypt(text, shift = 3) {
  return caesarCipher(text, -shift);
}

function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToUtf8(encoded) {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(b64) {
  const binary = atob(b64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function importAesKey(passphrase) {
  const passphraseBytes = new TextEncoder().encode(passphrase);
  const digest = await crypto.subtle.digest('SHA-256', passphraseBytes);
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function aesEncrypt(text, passphrase) {
  const key = await importAesKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedText);
  const encryptedBytes = new Uint8Array(encrypted);
  return `${bytesToBase64(iv)}:${bytesToBase64(encryptedBytes)}`;
}

async function aesDecrypt(payload, passphrase) {
  const [ivB64, cipherB64] = payload.split(':');
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid AES payload format. Expected iv:ciphertext.');
  }

  const key = await importAesKey(passphrase);
  const iv = base64ToBytes(ivB64);
  const encryptedBytes = base64ToBytes(cipherB64);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBytes,
  );
  return new TextDecoder().decode(decryptedBuffer);
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function processText(isDecrypt = false) {
  clearStatus();
  const values = validateInputs(isDecrypt);
  if (!values) return;

  const { text, algorithm, secretKey } = values;

  try {
    let result = '';

    if (algorithm === 'caesar') {
      result = isDecrypt ? caesarDecrypt(text) : caesarCipher(text);
    } else if (algorithm === 'base64') {
      result = isDecrypt ? base64ToUtf8(text) : utf8ToBase64(text);
    } else if (algorithm === 'aes') {
      result = isDecrypt ? await aesDecrypt(text, secretKey) : await aesEncrypt(text, secretKey);
    } else if (algorithm === 'sha256') {
      result = await sha256(text);
    }

    cipherTextEl.value = result;
    setStatus(isDecrypt ? 'Text decrypted successfully.' : 'Operation completed successfully.');
  } catch (error) {
    setStatus(error.message || 'Operation failed. Please check your input.', true);
  }
}

async function copyOutput() {
  clearStatus();
  if (!cipherTextEl.value.trim()) {
    setStatus('Nothing to copy yet.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(cipherTextEl.value);
    setStatus('Output copied to clipboard.');
  } catch {
    setStatus('Failed to copy output. Please copy manually.', true);
  }
}

algorithmEl.addEventListener('change', () => {
  const showAesKey = algorithmEl.value === 'aes';
  keyGroupEl.classList.toggle('hidden', !showAesKey);
  decryptBtn.disabled = algorithmEl.value === 'sha256';
  clearStatus();
});

encryptBtn.addEventListener('click', () => {
  processText(false);
});

decryptBtn.addEventListener('click', () => {
  processText(true);
});

copyBtn.addEventListener('click', copyOutput);
