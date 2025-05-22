<template>
  <div>
    <button @click="downloadFile" :disabled="isDownloading" class="download-action-button">
      {{ isDownloading ? '下載解密中...' : '下載' }}
    </button>
  </div>
</template>

<script>
// 確保此路徑正確指向你的下載服務
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
    };
  },
  methods: {
    async downloadFile() {
      this.isDownloading = true;
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
        console.log(`檔案 ID: ${this.fileId} 下載並解密完成！`);
      } catch (error) {
        console.error('下載和解密檔案失敗:', error);
        this.$emit('download-error', error);
      } finally {
        this.isDownloading = false;
      }
    },
  }
};
</script>

<style scoped>
/* 為了讓按鈕樣式與原有的 UserDashboard 和 FileListDisplay 保持一致，
   我們調整一下按鈕的類別名稱，並在 FileListDisplay 中進行統一管理。
   這裡只保留獨立按鈕的基礎樣式，將共用的樣式移出去。 */
.download-action-button {
  padding: 8px; /* 調整 padding 以適應 FileListDisplay 中的 action-button */
  background-color: transparent; /* 預設為透明 */
  border: none;
  color: #dadada; /* 預設文字顏色 */
  font-size: 1.1em;
  cursor: pointer;
  border-radius: 40%;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.download-action-button:hover:enabled {
  background-color: #4a4a4a; /* hover 時背景變色 */
  color: #afaefc; /* hover 時顏色變為藍色 */
}

.download-action-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  color: #888888; /* 禁用時文字顏色 */
}

.error-message {
  color: red;
  font-size: 0.8em;
  margin-top: 5px;
  text-align: center; /* 讓錯誤訊息居中 */
}
</style>
