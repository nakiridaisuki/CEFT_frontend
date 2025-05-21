<template>
  <div class="file-upload-container">
    <h3>上傳加密文件</h3>
    <div class="upload-area">
      <label for="fileInput" class="file-label">
        選擇檔案
        <input type="file" id="fileInput" @change="handleFileSelected" class="file-input">
      </label>
      <button @click="uploadEncryptedFile" :disabled="!selectedFile || uploading">
        {{ uploading ? '上傳中...' : '上傳加密檔案' }}
      </button>
      <div v-if="selectedFile" class="file-info">
        已選擇檔案：{{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </div>
      <div v-if="uploadProgress > 0 && uploading" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }">{{ uploadProgress }}%</div>
      </div>
      <div v-if="uploadError" class="error-message">{{ uploadError }}</div>
      <div v-if="uploadSuccess" class="success-message">{{ uploadSuccess }}</div>
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
      uploadError: null,
      uploadSuccess: null,
    };
  },
  methods: {
    handleFileSelected(event) {
      this.selectedFile = event.target.files[0];
      this.uploadError = null;
      this.uploadSuccess = null;
    },
    updateUploadProgress(progress) {
      this.uploadProgress = progress;
    },
    async uploadEncryptedFile() {
      if (!this.selectedFile) {
        this.uploadError = '請先選擇要上傳的檔案。';
        return;
      }

      this.uploading = true;
      this.uploadProgress = 0;
      this.uploadError = null;
      this.uploadSuccess = null;

      try {
        const response = await encryptFileAndUpload(this.selectedFile, this.updateUploadProgress)

        this.uploading = false;
        this.uploadSuccess = '檔案加密上傳成功！';
        this.$emit('file-uploaded'); // 觸發事件，通知父 component 重新載入文件列表 (如果需要)
        this.selectedFile = null;
        console.log('檔案加密上傳成功:', response.data);
      } catch (error) {
        this.uploading = false;
        console.error('檔案加密上傳失敗:', error);
        this.uploadError = '檔案加密上傳失敗，請稍後再試。';
        if (error.response && error.response.data && error.response.data.message) {
          this.uploadError = error.response.data.message;
        }
      }
    },
    formatFileSize,
  },
};
</script>

<style scoped>
.file-upload-container {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
}

h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
}

.upload-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-label {
  display: inline-block;
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  text-align: center;
}

.file-label:hover {
  background-color: #0056b3;
}

.file-input {
  display: none; /* 隱藏預設的 input[type="file"] */
}

button {
  padding: 10px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

button:hover:enabled {
  background-color: #1e7e34;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.file-info {
  margin-top: 10px;
  color: #777;
  font-size: 0.9em;
}

.progress-bar-container {
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  height: 20px;
  margin-top: 10px;
}

.progress-bar {
  background-color: #007bff;
  color: white;
  text-align: center;
  height: 100%;
  line-height: 20px;
  border-radius: 4px;
  width: 0%; /* 初始寬度 */
  transition: width 0.3s ease;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.success-message {
  color: green;
  margin-top: 10px;
}
</style>