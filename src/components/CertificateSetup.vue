<template>
  <div class="certificate-popover" ref="popover">
    <div v-if="certificateOwnerName" class="certOwnerName">
      憑證擁有者：{{ certificateOwnerName }}
    </div>

    <h3>上傳憑證檔案</h3>
    <p class="description">支援 .pem 格式</p>

    <input type="file"
           ref="certFileInput"
           @change="handleFileChange"
           accept=".pem"
           style="display: none;" />
    <div class="custom-file-input">
      <span class="placeholder" :class="{ 'has-certificate': uploadedCertificate }">{{ uploadedCertificate ? uploadedCertificate.name : '未選擇檔案。' }}</span>
      <button @click="triggerFileInput" class="browse-button">瀏覽...</button>
    </div>

    <div class="popover-actions">
      <button class="upload-button" @click="saveCertificateToLocal" :disabled="!uploadedCertificate">儲存憑證到本地</button>
      <button class="cancel-button" @click="closePopover">取消</button>
    </div>
  </div>
</template>

<script>
import { X509 } from 'jsrsasign';

export default {
  name: 'CertificateSetup',
  data() {
    return {
      uploadedCertificate: null,
      certificateContent: null, // 用於儲存文件內容
      uploadMessage: '',
      certificateOwnerName: '',
    };
  },
  mounted() {
    this.getCertificateOwnerName();
  },
  methods: {
    getCertificateOwnerName() {
      const certificate = localStorage.getItem('userCertificate');
      if (!certificate) {
        console.error("Don't have certificate!");
        return;
      }

      const x509 = new X509();
      x509.readCertPEM(certificate);
      const subjectDump = x509.getSubjectString();
      const cnMatch = subjectDump.match(/CN=([^/]+)/);
      if (cnMatch && cnMatch[1]) {
        this.certificateOwnerName = cnMatch[1];
      }
      else {
        console.error("Faild to get cn");
      }
    },
    triggerFileInput() {
      this.$refs.certFileInput.click();
      this.handleInputFocus();
    },
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file && (file.type === 'application/x-pem-file' || file.name.endsWith('.pem'))) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.uploadedCertificate = file; // 保存 File 物件
          this.certificateContent = e.target.result; // 保存文件內容用於 localStorage
          this.uploadMessage = '憑證已選擇，您可以儲存到本地。';
        };
        reader.onerror = () => {
          this.uploadedCertificate = null;
          this.certificateContent = null;
          this.uploadMessage = '讀取憑證檔案失敗。';
        };
        reader.readAsText(file);
        this.$emit('fileSelected');
      } else if (file) {
        this.uploadedCertificate = null;
        this.certificateContent = null;
        this.uploadMessage = '請上傳 .pem 格式的憑證檔案。';
      } else {
        this.uploadedCertificate = null;
        this.certificateContent = null;
        this.uploadMessage = '';
      }
    },
    saveCertificateToLocal() {
      if (this.certificateContent) {
        localStorage.setItem('userCertificate', this.certificateContent);
        this.uploadMessage = '憑證已成功儲存到本地。';
        this.uploadedCertificate = null;
        this.certificateContent = null;
        this.$refs.certFileInput.value = '';
        this.$emit('certificateSaved');
      } else {
        this.uploadMessage = '請先上傳憑證檔案。';
      }
      this.getCertificateOwnerName();
    },
    closePopover() {
      this.$emit('close');
      this.uploadedCertificate = null;
      this.certificateContent = null;
      this.uploadMessage = '';
      this.uploadStatusClass = '';
      if (this.$refs.certFileInput) {
        this.$refs.certFileInput.value = '';
      }
    },
    handleInputFocus() {
      this.$emit('fileInputFocus'); // **新增事件：通知父組件 input 活躍**
    },
  }
};
</script>

<style scoped>
.certificate-popover {
  /* 保持其尺寸、背景、陰影、間距、文字顏色、過渡等樣式 */
  background-color: #3c4043;
  border-radius: 8px;
  padding: 20px; /* 這個 padding 是 Popover 內部的空間 */
  width: 300px;
  height: 300px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: #e8eaed;
  opacity: 0;
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

input[type="file"]::-webkit-file-upload-button {
  display: none; /* 隱藏 Chrome/Safari 中的原生按鈕 */
}

input[type="file"]::file-selector-button {
  display: none; /* 隱藏 Firefox/Edge 中的原生按鈕 */
}

.custom-file-input {
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between; /* 讓內容和按鈕分開 */
  width: 80%;
  padding: 8px 12px;
  border: 1px solid #666; /* 圓角邊框，灰色 */
  border-radius: 4px; /* 圓角 */
  background-color: #2f3032; /* 背景色 */
  color: #e8eaed;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.custom-file-input .placeholder {
  flex-grow: 1; /* 佔據剩餘空間 */
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #a0a0a0; /* 預設文字顏色 */
  text-align: center;
}

.placeholder.has-certificate {
  color: #e8eaed; /* 預設文字顏色 */
}

/* 瀏覽按鈕的樣式 */
.browse-button {
  background-color: #5f4fcc; /* 藍色背景 */
  font-weight: 600;
  font-size: 0.9em;
  color: #cecece; /* 深色文字 */
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0; /* 防止按鈕縮小 */
}

.browse-button:hover {
  border-color: #7e6dd3;
  background-color: #7e6dd3;
}

.certOwnerName {
  margin: 0;
  font-size: 1em;
  color: #f0f0f0;
  text-align: center;
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
  justify-content: center;
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
  background-color: #5f4fcc;
  color: #cecece;
}

.upload-button:hover:not(:disabled) {
  background-color: #7e6dd3;
  transform: translateY(-2px); /* 輕微上浮效果 */
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
  transform: translateY(-2px); /* 輕微上浮效果 */
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
