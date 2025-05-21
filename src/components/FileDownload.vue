<template>
  <button @click="downloadFile" :disabled="isDownloading">
    {{ isDownloading ? '下載解密中...' : '下載' }}
  </button>
  <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
</template>

<script>
import { downloadAndDecryptFile } from '@/services/fileDownload';

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
      errorMessage: null,
      canDownload: false,
    };
  },
  methods: {
    async downloadFile() {
      this.isDownloading = true;
      this.errorMessage = null;
      try {
        const decryptedBlob = await downloadAndDecryptFile(this.fileId);
        const url = window.URL.createObjectURL(decryptedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', this.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下載和解密檔案失敗:', error);
        this.errorMessage = error.message || '下載和解密檔案失敗，請稍後再試。';
      } finally {
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