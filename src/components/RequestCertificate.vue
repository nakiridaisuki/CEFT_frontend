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
      <textarea rows="5" cols="60" readonly>{{ privateKey }}</textarea>
      <button @click="downloadPrivateKey">下載私鑰</button>
      <p><strong>數位憑證:</strong></p>
      <textarea rows="10" cols="60" readonly>{{ certificate }}</textarea>
      <button @click="downloadCertificate">下載憑證</button>
      <p v-if="downloadError" class="error-message">{{ downloadError }}</p>
    </div>
  </div>
</template>

<script>
import { generateRSAPemKey } from '@/utils/crypto';
import { requestCertificate } from '@/services/kmsService';

export default {
  name: 'RequestCertificate',
  data() {
    return {
      publicKey: null,
      privateKey: null,
      certificate: localStorage.getItem('userCertificate') || '',
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
        const keyPair = await generateRSAPemKey();
        this.publicKey = keyPair.publicKeyPEM;
        this.privateKey = keyPair.privateKeyPEM;

        this.certificate = await requestCertificate(this.username, this.publicKey);
      } catch (error) {
        console.error('生成金鑰並請求憑證失敗:', error);
        this.error = '生成金鑰並請求憑證失敗，請稍後再試。';
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        }
      } finally {
        this.generatingOrRequesting = false;
      }
    },
    downloadPrivateKey() {
      if (!this.privateKey) {
        this.downloadError = '私鑰尚未生成。';
        return;
      }
      this.downloadFile('private_key.pem', this.privateKey, 'text/plain');
    },
    downloadCertificate() {
      if (!this.certificate) {
        this.downloadError = '憑證尚未簽發。';
        return;
      }
      this.downloadFile('certificate.pem', this.certificate, 'text/plain');
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