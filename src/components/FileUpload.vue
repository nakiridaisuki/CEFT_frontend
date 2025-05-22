<template>
  <div class="file-upload-container">
    <div class="upload-area">
      <input
        type="file"
        id="fileInput"
        ref="fileInput"
        @change="handleFileSelected"
        class="hidden-file-input"
      />

      <button
        @click="handleMainButtonClick"
        :disabled="uploading"
        class="main-upload-button"
      >
        <span v-if="!uploading" class="main-upload-button-text">新增檔案</span>
        <span v-else="uploading" class="main-upload-button-text">上傳中...</span>
      </button>

      <div v-if="uploadProgress > 0 && uploading" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }">{{ uploadProgress }}%</div>
      </div>

      <div v-if="uploadStatusMessage" :class="{'success-message': uploadStatus, 'error-message': !uploadStatus}">{{ uploadStatusMessage }}</div>
    </div>
  </div>
</template>

<script>
import { formatFileSize } from '@/utils/utile';
import { encryptFileAndUpload } from '@/services/fileUpload';

export default {
  name: 'FileUpload',
  data() {
    return {
      selectedFile: null,
      uploading: false,
      uploadProgress: 0,
      uploadStatus: null,
      uploadStatusMessage: null,
      uploadStatusTimeout: null,
    };
  },
  methods: {
    setUploadStatus(status, message) {
      this.uploadStatus = status;
      this.uploadStatusMessage = message;
      this.uploadStatusTimeout = setTimeout(() => {
        this.uploadStatus = null;
        this.uploadStatusMessage = null;
      }, 2000);
    },
    clearUploadStatus() {
      this.uploadStatus = null;
      this.uploadStatusMessage = null;
      clearTimeout(this.uploadStatusTimeout);
    },
    handleMainButtonClick() {
      this.$refs.fileInput.click();
      this.clearUploadStatus();
      this.uploadProgress = 0;
    },
    handleFileSelected(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.clearUploadStatus();
        this.uploadEncryptedFile();
      } else {
        this.selectedFile = null;
        this.setUploadStatus(false, '未選擇任何檔案。');
      }
    },

    updateUploadProgress(progress) {
      this.uploadProgress = progress;
    },

    async uploadEncryptedFile() {
      if (!this.selectedFile) {
        this.setUploadStatus(false, '沒有可上傳的檔案。');
        return;
      }

      if (!localStorage.getItem('userCertificate')) {
        this.setUploadStatus(false, '沒有憑證。');
        return;
      }

      this.uploading = true;
      this.uploadProgress = 0;
      this.resetMessages(); // 開始上傳時清除舊訊息

      try {
        const response = await encryptFileAndUpload(this.selectedFile, this.updateUploadProgress, this.$router);

        this.uploading = false;
        this.setUploadStatus(true, '檔案上傳成功！');
        this.$emit('file-uploaded');
        this.selectedFile = null; // 上傳成功後清空選中的檔案，按鈕回到“選擇檔案”狀態
        console.log('檔案上傳成功:', response.data);
      } catch (error) {
        this.uploading = false;
        console.error('檔案上傳失敗:', error);
        this.setUploadStatus(false, '檔案上傳失敗，請稍後再試。');
        if (error.response && error.response.data && error.response.data.message) {
          this.setUploadStatus(false, error.response.data.message);
        }
      }
    },

    // 輔助方法：重置錯誤和成功訊息
    resetMessages() {
      this.clearUploadStatus();
    },

    formatFileSize,
  },
};
</script>

<style scoped>
.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* 水平置中所有內容 */
  margin-bottom: 20px;
  padding: 10px; /* 增加內邊距 */
  border-radius: 4px;
  background-color: #2f3032; /* 深色背景 */
  color: #e8eaed; /* 淺色文字 */
  height: 100px;
  width: 250px; /* 適當寬度 */
  margin: 0 auto; /* 置中容器本身 */
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center; /* 讓內部元素也水平置中 */
  width: 100%;
  gap: 15px; /* 元素之間的間距 */
}

/* 隱藏實際的檔案輸入框 */
.hidden-file-input {
  display: none;
}

/* 主上傳按鈕的樣式 */
.main-upload-button {
  background-color: #5f4fcc; /* 藍色按鈕 */
  color: #202124; /* 深色文字 */
  border: none;
  border-radius: 10px;
  padding: 12px 25px;
  font-size: 1.4em;
  font-weight: bold; /* 加粗文字 */
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  height: 100%;
  width: 100%; /* 按鈕寬度 */
  max-width: 280px; /* 限制最大寬度 */
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); /* 按鈕陰影 */
}

/* 上傳檔案按鈕的特定背景色 */
.main-upload-button span[v-else-if="selectedFile && !uploading"] {
  background-color: #28a745; /* 綠色 */
}

.main-upload-button:hover:not(:disabled) {
  background-color: #7e6dd3;
  transform: translateY(-2px); /* 輕微上浮效果 */
}

/* 針對「上傳檔案」狀態的 hover 顏色 */
.main-upload-button:hover:not(:disabled):not([v-else-if="selectedFile && !uploading"]) {
  background-color: #7e6dd3; /* 選擇檔案狀態的 hover 藍色 */
}

.main-upload-button:hover:not(:disabled)[v-else-if="selectedFile && !uploading"] {
  background-color: #1e7e34; /* 上傳檔案狀態的 hover 綠色 */
}


.main-upload-button:disabled {
  background-color: #555;
  color: #aaa;
  cursor: not-allowed;
  opacity: 0.7; /* 禁用時透明度降低 */
}

.main-upload-button-text {
  color: #f0f0f0;
  font-size: 1em;
  margin-bottom: 30px;
  font-weight: 300;
}

/* 檔案資訊顯示 */
.file-info {
  font-size: 0.95em;
  color: #b0b0b0;
  display: flex;
  align-items: center;
  gap: 2px; /* 圖示和文字間距 */
  word-break: break-all; /* 防止長文件名溢出 */
  text-align: center;
  max-width: 90%; /* 限制資訊顯示寬度 */
  line-height: 1.2; /* 調整行高 */
}

.file-info.selected {
    color: #e8eaed; /* 選中檔案後顏色更亮 */
    font-weight: bold;
}

.file-icon {
    color: #8ab4f8; /* 給圖示一個顏色 */
    font-size: 1.1em; /* 圖示大小 */
}

/* 進度條樣式 */
.progress-bar-container {
  width: 80%;
  background-color: #4a4a4a; /* 進度條背景 */
  border-radius: 5px;
  height: 12px; /* 增加高度 */
  overflow: hidden;
  margin-top: 10px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3); /* 內部陰影 */
}

.progress-bar {
  background-color: #4CAF50; /* 進度條顏色 */
  color: white;
  text-align: center;
  height: 100%;
  line-height: 12px; /* 與高度一致 */
  border-radius: 5px;
  width: 0%; /* 初始寬度 */
  transition: width 0.3s ease;
  font-size: 0.7em; /* 字體大小 */
}

/* 訊息樣式 */
.error-message {
  color: #f44336; /* 紅色 */
  font-size: 0.9em;
  text-align: center;
  font-weight: bold;
}

.success-message {
  color: #4CAF50; /* 綠色 */
  font-size: 0.9em;
  text-align: center;
  font-weight: bold;
}
</style>
