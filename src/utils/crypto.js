export async function importPublicKey(pemKey) {
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

export async function importPrivateKey(pemKey) {
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

export async function generateAesKeyAndIv() {
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

export async function generateRSAPemKey() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  const publicKey = keyPair.publicKey;
  const privateKey = keyPair.privateKey;

  // 匯出公鑰為 spki 格式並轉換為 PEM
  const exportedPublicKey = await window.crypto.subtle.exportKey('spki', publicKey);
  const publicKeyBuffer = new Uint8Array(exportedPublicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBuffer));
  const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;

  // 匯出私鑰為 pkcs8 格式並轉換為 PEM
  const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', privateKey);
  const privateKeyBuffer = new Uint8Array(exportedPrivateKey);
  const privateKeyBase64 = btoa(String.fromCharCode(...privateKeyBuffer));
  const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;

  return { privateKeyPEM, publicKeyPEM };
}

export async function encryptFile(file, aesKey, iv) {
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

export async function decryptFile(encryptedData, aesKey, iv) {
  return crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    aesKey,
    encryptedData
  );
}

export async function wrapKey(aesKey, publicKey) {
  return await window.crypto.subtle.wrapKey(
    'raw',
    aesKey,
    publicKey,
    {
      name: 'RSA-OAEP',
    }
  );
}

export async function unwrapKey(wrappedKey, privateKey) {
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
