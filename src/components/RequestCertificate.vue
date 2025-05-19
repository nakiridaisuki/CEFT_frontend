<template>
  <div class="request-certificate-container">
    <h3>請求憑證</h3>
    <div v-if="!certificate">
      <button @click="generateAndRequestCertificate" :disabled="generatingOrRequesting">
        {{ generatingOrRequesting ? '產生金鑰並請求憑證中...' : '生成並請求憑證' }}
      </button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </div>
    <div v-if="certificate">
      <h3>憑證已簽發</h3>
      <p><strong>私鑰 (請務必安全保存):</strong></p>
      <textarea rows="5" cols="60" readonly>{{ privateKeyPEM }}</textarea>
      <button @click="downloadPrivateKey">下載私鑰</button>
      <p><strong>數位憑證:</strong></p>
      <textarea rows="10" cols="60" readonly>{{ certificatePEM }}</textarea>
      <button @click="downloadCertificate">下載憑證</button>
      <p v-if="downloadError" class="error-message">{{ downloadError }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { GENERATE_CERTIFICATE_URL } from '../config/apiConfig';

export default {
  name: 'RequestCertificate',
  data() {
    return {
      publicKey: null,
      privateKey: null,
      publicKeyPEM: '',
      certificate: null,
      privateKeyPEM: '',
      certificatePEM: '',
      generatingOrRequesting: false,
      error: null,
      downloadError: null,
      username: localStorage.getItem('username') || '',
    };
  },
  methods: {
    async generateAndRequestCertificate() {
      if (!window.crypto || !window.crypto.subtle) {
        this.error = '您的瀏覽器不支援 Web Crypto API。';
        return;
      }

      this.generatingOrRequesting = true;
      this.error = null;

      try {
        // 1. 生成金鑰對
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

        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;

        // 匯出公鑰為 spki 格式並轉換為 PEM
        const exportedPublicKey = await window.crypto.subtle.exportKey('spki', this.publicKey);
        const publicKeyBuffer = new Uint8Array(exportedPublicKey);
        const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyBuffer));
        this.publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
        
        // 匯出私鑰為 pkcs8 格式並轉換為 PEM
        const exportedPrivateKey = await window.crypto.subtle.exportKey('pkcs8', this.privateKey);
        const privateKeyBuffer = new Uint8Array(exportedPrivateKey);
        const privateKeyBase64 = btoa(String.fromCharCode(...privateKeyBuffer));
        this.privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
        
        // 2. 請求憑證
        const formData = new FormData();
        formData.append('username', this.username);
        formData.append('publicKey', this.publicKeyPEM);
        const response = await axios.post(GENERATE_CERTIFICATE_URL, formData, {
          headers: {
            'Content-Type': 'application/form-data',
          },
        });

        this.certificate = true;
        this.certificatePEM = response.data.data.certificate;

        this.generatingOrRequesting = false;

      } catch (error) {
        console.error('生成金鑰並請求憑證失敗:', error);
        this.error = '生成金鑰並請求憑證失敗，請稍後再試。';
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        }
        this.generatingOrRequesting = false;
      }
    },
    downloadPrivateKey() {
      if (!this.privateKeyPEM) {
        this.downloadError = '私鑰尚未生成。';
        return;
      }
      this.downloadFile('private_key.pem', this.privateKeyPEM, 'text/plain');
    },
    downloadCertificate() {
      if (!this.certificatePEM) {
        this.downloadError = '憑證尚未簽發。';
        return;
      }
      this.downloadFile('certificate.pem', this.certificatePEM, 'text/plain');
    },
    downloadFile(filename, content, contentType) {
      const element = document.createElement('a');
      element.setAttribute('href', `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      this.downloadError = null;
    },
  },
};
</script>

<style scoped>
.request-certificate-container {
    padding: 20px;
    border: 1px solid #eee;
    border-radius: 4px;
    background-color: #f9f9f9;
    margin-bottom: 20px;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #555;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

input[type='text'] {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
  margin-bottom: 10px;
}

button:hover:enabled {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

textarea {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-family: monospace;
  font-size: 0.9em;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>