<template>
  <button @click="downloadAndDecryptFile" :disabled="isDownloading">
    {{ isDownloading ? '下載解密中...' : '下載' }}
  </button>
  <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
</template>

<script>
import { fetchFileKeyData, fetchEncryptedFile } from '@/services/fileDownload';
import { requestKeys } from '@/services/kmsService';
import { importPrivateKey, unwrapKey, decryptFile } from '@/utils/crypto';

export default {
  name: 'EncryptedFileDownloader',
  props: {
    fileId: {
      type: Number,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      isDownloading: false,
      fileKeyData: null,
      userPrivateKey: null,
      encryptedFileBlob: null,
      errorMessage: null,
      canDownload: false,
    };
  },
  methods: {
    async downloadAndDecryptFile() {
      this.isDownloading = true;
      this.errorMessage = null;

      this.fileKeyData = await fetchFileKeyData(this.fileId);
      const privateKeyResponse = await requestKeys(localStorage.getItem('username'), 'private');
      this.userPrivateKey = await importPrivateKey(privateKeyResponse.key);

      console.log(this.userPrivateKey)

      try {
        // 1. 解包檔案金鑰
        const unwrappedKey = await unwrapKey(
          this.fileKeyData.encryptedKey,
          this.userPrivateKey
        );
        if (!unwrappedKey) {
          this.errorMessage = '解包檔案金鑰失敗。';
          this.isDownloading = false;
          return;
        }

        // 2. 請求加密檔案
        this.encryptedFileBlob = await fetchEncryptedFile(this.fileId);
        if (!this.encryptedFileBlob) {
          this.errorMessage = '請求加密檔案失敗。';
          this.isDownloading = false;
          return;
        }

        // 3. 解密檔案
        const iv = this.fileKeyData.iv;
        const encryptedData = await this.encryptedFileBlob.arrayBuffer();
        const decryptedData = await decryptFile(encryptedData, unwrappedKey, iv);

        // 4. 創建 Blob 並下載
        const decryptedBlob = new Blob([decryptedData]);
        const url = window.URL.createObjectURL(decryptedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', this.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;

      } catch (error) {
        console.error('下載和解密檔案失敗:', error);
        this.errorMessage = error.message || '下載和解密檔案失敗，請稍後再試。';
        this.isDownloading = false;
      }
    },
  }
};
</script>

<style scoped>
button {
  padding: 5px 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: background-color 0.3s ease;
  margin-left: 10px;
}

button:hover:enabled {
  background-color: #1e7e34;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  font-size: 0.8em;
  margin-top: 5px;
}
</style>