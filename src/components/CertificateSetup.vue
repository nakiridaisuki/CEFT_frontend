<template>
  <div class="certificate-popover" ref="popover">
    <h3>上傳憑證檔案</h3>
    <p class="description">支援 .pem 格式</p>
    <input type="file" ref="certFileInput" @change="handleFileChange" accept=".pem" />

    <div v-if="uploadedCertificate" class="selected-file-info">
      已選擇: <span>{{ uploadedCertificate.name }}</span>
    </div>

    <div class="popover-actions">
      <button class="upload-button" @click="saveCertificateToLocal" :disabled="!uploadedCertificate">儲存憑證到本地</button>
      <button class="cancel-button" @click="closePopover">取消</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CertificateUploadPopover',
  data() {
    return {
      uploadedCertificate: null,
      uploadMessage: '',
      uploadedCertificate: null
    };
  },
  mounted() {
    // 當組件掛載後，監聽點擊外部事件來關閉 Popover
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    // 組件銷毀前移除事件監聽
    document.removeEventListener('click', this.handleClickOutside);
  },
  methods: {
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file && file.type === 'application/x-pem-file' || file.name.endsWith('.pem')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.uploadedCertificate = e.target.result;
          this.certificateUploadMessage = '憑證已選擇，您可以儲存到本地。';
        };
        reader.onerror = () => {
          this.uploadedCertificate = null;
          this.certificateUploadMessage = '讀取憑證檔案失敗。';
        };
        reader.readAsText(file);
      } else if (file) {
        this.uploadedCertificate = null;
        this.certificateUploadMessage = '請上傳 .pem 格式的憑證檔案。';
      } else {
        this.uploadedCertificate = null;
        this.certificateUploadMessage = '';
      }
    },
    saveCertificateToLocal() {
      if (this.uploadedCertificate) {
        localStorage.setItem('userCertificate', this.uploadedCertificate);
        this.certificateUploadMessage = '憑證已成功儲存到本地。';
        this.uploadedCertificate = null;
        this.$refs.certFileInput.value = '';

        this.$emit('certificateSaved');
        this.closePopover(); // 上傳成功後自動關閉
      } else {
        this.certificateUploadMessage = '請先上傳憑證檔案。';
      }
    },
    closePopover() {
      // 觸發事件通知父組件關閉 Popover
      this.$emit('close');
      this.uploadedCertificate = null;
      this.uploadMessage = '';
      this.uploadStatusClass = '';
      if (this.$refs.certFileInput) {
        this.$refs.certFileInput.value = '';
      }
    },
    handleClickOutside(event) {
      // 如果點擊事件的目標不是 Popover 內部，且不是觸發按鈕本身，則關閉 Popover
      if (this.$refs.popover && !this.$refs.popover.contains(event.target)) {
        // 這裡需要一個額外的判斷，確保點擊觸發按鈕時不會關閉
        // 最佳做法是讓父組件來判斷是否關閉，因為它知道哪個按鈕觸發了 Popover
        // 所以這裡只發出一個事件，讓父組件決定
        this.$emit('clickOutside');
      }
    }
  }
};
</script>

<style scoped>
.certificate-popover {
  position: absolute; /* 相對於父級 (relative) 定位 */
  bottom: calc(100% + 15px); /* 定位在按鈕上方，留出一些間距 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
  background-color: #3c4043; /* 比側邊欄淺一些的深色 */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 20px;
  width: 300px; /* 小區塊的寬度 */
  z-index: 1500; /* 確保在模態框下方，但在頁面元素上方 */
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: #e8eaed;
  opacity: 0; /* 初始隱藏，用於過渡 */
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
}

/* 在 Dashboard.vue 中控制顯示時添加的類別 */
.certificate-popover.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(-5px); /* 向上輕微移動效果 */
}

h3 {
  margin: 0;
  font-size: 1.3em;
  color: #f0f0f0;
  text-align: center;
}

.description {
  font-size: 0.9em;
  color: #a0a0a0;
  text-align: center;
  margin-bottom: 5px;
}

input[type="file"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #4a4a4a;
  border-radius: 5px;
  background-color: #2f3032;
  color: #e8eaed;
}

input[type="file"]::-webkit-file-upload-button {
  background-color: #8ab4f8;
  color: #202124;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-right: 10px;
}

input[type="file"]::-webkit-file-upload-button:hover {
  background-color: #6a9ce6;
}

.selected-file-info {
  font-size: 0.9em;
  color: #a0a0a0;
  text-align: center;
  word-break: break-all; /* 防止長文件名溢出 */
}

.selected-file-info span {
  font-weight: bold;
  color: #f0f0f0;
}

.popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.upload-button, .cancel-button {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  transition: background-color 0.2s ease;
}

.upload-button {
  background-color: #8ab4f8;
  color: #202124;
}

.upload-button:hover:not(:disabled) {
  background-color: #6a9ce6;
}

.upload-button:disabled {
  background-color: #555;
  color: #aaa;
  cursor: not-allowed;
}

.cancel-button {
  background-color: #4a4a4a;
  color: #e8eaed;
}

.cancel-button:hover:not(:disabled) {
  background-color: #5a5a5a;
}

.success {
  color: #4CAF50;
  font-weight: bold;
  text-align: center;
}

.error {
  color: #f44336;
  font-weight: bold;
  text-align: center;
}
</style>