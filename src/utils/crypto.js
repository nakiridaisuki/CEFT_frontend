// src/utils/cryptoUtils.js
async function importPublicKey(pemKey) {
  // 將 PEM 格式的公鑰轉換為 ArrayBuffer
  const binaryDerString = window.atob(pemKey.replace(/(-----BEGIN PUBLIC KEY-----)|(-----END PUBLIC KEY-----)|\n/g, ''));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['wrapKey']
  );
}

async function importPrivateKey(pemKey) {
  const binaryDerString = window.atob(pemKey.replace(/(-----BEGIN PRIVATE KEY-----)|(-----END PRIVATE KEY-----)|\n/g, ''));
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return await window.crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['unwrapKey']
  );
}

async function generateAesKeyAndIv() {
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  return { aesKey, iv };
}

async function encryptFile(file, aesKey, iv) {
  const fileBuffer = await file.arrayBuffer();
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
        name: 'AES-GCM',
        iv: iv,
    },
    aesKey,
    fileBuffer
);
return new Blob([encryptedContent]);
}

async function decryptFile(encryptedData, aesKey, iv) {
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    encryptedData
  );
}

async function wrapKey(aesKey, publicKey) {
  return await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    publicKey,
    {
      name: 'RSA-OAEP',
    }
  );
}

async function unwrapKey(wrappedKey, privateKey) {
  return await window.crypto.subtle.unwrapKey(
    'raw',
    new Uint8Array(wrappedKey),
    privateKey,
    {
      name: 'RSA-OAEP',
    },
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['decrypt']
  );
}


export { importPrivateKey, importPublicKey, generateAesKeyAndIv, encryptFile, decryptFile, wrapKey, unwrapKey };