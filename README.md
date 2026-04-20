# Web-Based Text Encryption Tool

This project is a single-page web app that encrypts, decrypts, and hashes text directly in the browser.

## Features

- Plain text input area
- Algorithm dropdown with:
  - Caesar Cipher
  - Base64
  - AES-GCM (passphrase-based)
  - SHA-256 hashing
- Encrypt button to generate output
- Decrypt button for reversible methods (Caesar, Base64, AES)
- Copy output button for quick clipboard copy
- Input validation for empty text, missing algorithm, and AES key requirements

## Encryption techniques used

1. **Caesar Cipher**
   - Classical substitution cipher with a fixed shift of 3.
   - Supports both uppercase and lowercase letters.

2. **Base64 encoding**
   - Converts UTF-8 text to Base64 and back.
   - Useful for reversible text encoding (not secure cryptographic encryption).

3. **AES-GCM**
   - Uses Web Crypto API (`crypto.subtle`) for authenticated encryption.
   - A SHA-256 digest of the user passphrase is used as the AES key material.
   - Output format is `base64(iv):base64(ciphertext)`.

4. **SHA-256 (bonus hashing option)**
   - One-way hash output in hex format.
   - Included as an optional advanced feature.

## How to run

1. Clone/download the repository.
2. Open `index.html` in a modern browser.
3. Enter text, choose an algorithm, and click **Encrypt** (or **Decrypt** when supported).

No backend server is required.
