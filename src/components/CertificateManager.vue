<template>
  <input type="file" @change="handleFileUpload" accept=".pem,.key" ref="fileInput" style="display: none;" />
  <div class="certificate-manager">
    <div v-if="currentPage === 'initial'" class="initial-view">
      <button @click="startGenerateCertificate" class="action-button">生成憑證</button>
      <div class="separator">或</div>
      <button @click="startImportPrivateKey" class="action-button">導入私鑰</button>
    </div>

    <div v-if="currentPage === 'generate'" class="generate-view">
      <h2 v-if="!generationComplete">生成憑證中...</h2>
      <div v-else="generationComplete" class="completion-message">
        <h3>憑證已生成完成！</h3>
        <p>請務必妥善保存私鑰，這是還原您檔案的唯一手段!</p>
        <p>金鑰會自動下載，如果沒有下載，請點擊下載按鈕</p>
        <div class="generate-buttons">
          <button @click="downloadPrivateKey" class="action-button download-button">下載金鑰</button>
          <button @click="closePopover" class="action-button">確定</button>
        </div>
      </div>
      <div v-if="error" class="error-message">
        <p>錯誤：{{ error }}</p>
      </div>
    </div>

    <div v-if="currentPage === 'import'" class="import-view">
      <div v-if="!importComplete">
        <h2>導入私鑰</h2>
        <p class="description">請選擇您的私鑰檔案：</p>

        <div class="custom-file-input">
          <span class="placeholder" :class="{ 'has-certificate': fileName }">{{ fileName ? fileName : '未選擇檔案。' }}</span>
          <button @click="triggerFileInput" class="browse-button">瀏覽...</button>
        </div>

        <button class="action-button upload-button" @click="generateCertFromPrivate" :disabled="!privateKeyPEM">導入私鑰</button>
      </div>
      <div v-else="importComplete" class="completion-message">
        <p>私鑰導入成功<br>已完成憑證請求！</p>
        <button @click="closePopover" class="action-button">確定</button>
      </div>
        <div v-if="error" class="error-message">
        <p>錯誤：{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { requestCertificate } from '@/services/kmsService';
import { extractPublicKey, generateCSR, generateRSAPemKey, importPrivateKey } from '@/utils/crypto';

export default {
  name: 'CertificateManager',
  props: {
    username: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      currentPage: 'initial', // 控制顯示哪個頁面：'initial', 'generate', 'import'
      generationComplete: false, // 控制生成憑證完成後的提示
      importComplete: false, // 控制導入私鑰完成後的提示
      fileName: null, // 儲存已選取的檔案名稱
      privateKey: null, // 用於儲存生成憑證時的私鑰 PEM 格式
      privateKeyPEM: '', // 用於儲存導入私鑰時讀取到的 PEM 格式
      error: '', // 錯誤訊息
    };
  },
  methods: {
    /**
     * 點擊「生成憑證」按鈕後觸發
     * 切換到生成憑證頁面，並觸發生成與請求憑證的流程
     */
    async startGenerateCertificate() {
      this.currentPage = 'generate';
      this.generationComplete = false;
      this.error = null; // 清除之前的錯誤訊息
      console.log('開始生成憑證...');

      await this.generateAndRequestCertificate();

      this.generationComplete = true;
      console.log('憑證生成流程完成。');
      this.$emit('readingDiscription');
    },
    async generateAndRequestCertificate() {
      if (!window.crypto || !window.crypto.subtle) {
        this.error = '您的瀏覽器不支援 Web Crypto API。';
        return;
      }

      try {
        const keyPair = await generateRSAPemKey(); // 假設這個函數會生成並返回 PEM 格式的私鑰和公鑰
        const csr = generateCSR(keyPair.privateKeyPEM, keyPair.publicKeyPEM, { commonName: this.username });
        const certificate = await requestCertificate(csr); // 假設這個函數會發送 CSR 並返回憑證

        this.privateKey = keyPair.privateKeyPEM; // 儲存生成的私鑰
        localStorage.setItem('userCertificate', certificate);
        this.$emit('certificateSaved'); // 通知父組件憑證已保存
        this.downloadPrivateKey();
      } catch (error) {
        console.error('生成金鑰並請求憑證失敗:', error);
        this.error = '生成金鑰並請求憑證失敗，請稍後再試。';
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        }
      }
    },
    downloadPrivateKey() {
      if (!this.privateKey) {
        this.error = '私鑰尚未生成。'; // 錯誤訊息統一用 error 變數
        return;
      }
      this.downloadFile('private_key.pem', this.privateKey, 'text/plain');
      this.error = null; // 清除錯誤訊息
    },

    /**
     * 點擊「導入私鑰」按鈕後觸發
     * 直接觸發檔案輸入框的點擊事件
     */
    startImportPrivateKey() {
      this.currentPage = 'import';
      this.importComplete = false;
      this.fileName = null;
      this.privateKeyPEM = ''; // 清空之前導入的私鑰內容
      this.error = null; // 清除之前的錯誤訊息
      console.log('準備導入私鑰...');

      // 直接觸發檔案選擇器
      this.triggerFileInput();
    },

    /**
     * 程式化地觸發檔案輸入框的點擊事件
     */
    triggerFileInput() {
      this.$refs.fileInput.click();
      this.$emit('fileInputFocus');
    },

    /**
     * 處理檔案上傳事件 (當檔案被選取時觸發)
     * 讀取選取的檔案內容
     * @param {Event} event - 檔案輸入框的 change 事件
     */
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.fileName = file.name;
        console.log('選取檔案:', file.name);

        const reader = new FileReader();
        reader.onload = async (e) => {
          this.privateKeyPEM = e.target.result; // 將讀取到的私鑰內容存儲起來
          console.log('私鑰檔案內容已讀取，長度:', this.privateKeyPEM.length);
        };
        reader.readAsText(file); // 以文本格式讀取檔案
        this.$emit('fileSelected');
      } else {
        this.fileName = null;
        this.privateKeyPEM = ''; // 清空私鑰內容
        console.log('未選擇檔案。');
      }
    },

    /**
     * 從導入的私鑰生成憑證並請求
     */
    async generateCertFromPrivate() {
      this.importComplete = false;
      this.error = null; // 清除之前的錯誤訊息
      if (!this.privateKeyPEM) {
        this.error = '請先上傳私鑰檔案。';
        return;
      }

      try {
        // 假設 extractPublicKey 和 generateCSR 函數都已經能夠處理 PEM 格式
        const publicKeyPEM = await extractPublicKey(this.privateKeyPEM);
        const csr = generateCSR(this.privateKeyPEM, publicKeyPEM, { commonName: this.username });
        const certificate = await requestCertificate(csr);

        localStorage.setItem('userCertificate', certificate);
        this.$emit('certificateSaved'); // 通知父組件憑證已保存
        this.importComplete = true;
        console.log('私鑰導入成功，已完成憑證請求！');
      } catch (error) {
        console.error('導入私鑰並請求憑證失敗:', error);
        this.error = '導入私鑰並請求憑證失敗，請稍後再試。';
        if (error.response && error.response.data && error.response.data.message) {
          this.error = error.response.data.message;
        }
      }
    },

    /**
     * 通用的檔案下載函數
     */
    downloadFile(filename, content, contentType) {
      const element = document.createElement('a');
      element.setAttribute('href', `data:${contentType};charset=utf-8,${encodeURIComponent(content)}`);
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    closePopover() {
      this.currentPage = 'initial';
      this.$emit('close');
    },
  },
};
</script>

<style scoped>
.certificate-manager {
  background-color: #2f3032;
  padding: 20px; /* 這個 padding 是 Popover 內部的空間 */
  width: 250px;
  height: 250px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #e8eaed;
}

.initial-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px; /* 按鈕之間的間距 */
}

/* 統一按鈕樣式 */
.action-button {
  padding: 8px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
  transition: background-color 0.2s ease, transform 0.2s ease; /* 新增 transform 過渡 */
  background-color: #5f4fcc; /* 主按鈕顏色 */
  color: #f0f0f0; /* 文字顏色 */
}

.action-button:hover:not(:disabled) {
  background-color: #7e6dd3;
  transform: translateY(-2px); /* 輕微上浮效果 */
}

.action-button:disabled {
  background-color: #555;
  color: #aaa;
  cursor: not-allowed;
}

/* 針對下載按鈕的特殊樣式，使其與其他按鈕風格一致 */
.download-button {
  background-color: #5f4fcc;
  color: #f0f0f0;
}

.download-button:hover:not(:disabled) {
  background-color: #7e6dd3;
}

.upload-button {
  margin-top: 10px;
  background-color: #5f4fcc;
  color: #f0f0f0;
}

.upload-button:hover:not(:disabled) {
  background-color: #7e6dd3;
}

.separator {
  font-size: 1em;
  color: #a0a0a0; /* 統一文字顏色 */
}

.generate-view, .import-view {
  text-align: center;
  width: 100%; /* 確保內容區塊佔滿父容器 */
}

.generate-view h2, .import-view h2 {
  color: #f0f0f0; /* 統一標題顏色 */
  margin-bottom: 15px;
  font-size: 1.3em;
}

.generate-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.description {
  font-size: 0.9em;
  color: #a0a0a0; /* 統一描述文字顏色 */
  text-align: center;
  margin-bottom: 5px;
}

/* 統一檔案輸入框的樣式 */
.custom-file-input {
  margin: 10px auto; /* 調整外邊距 */
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 90%; /* 保持一致的寬度 */
  padding: 8px 12px;
  border: 1px solid #666;
  border-radius: 4px;
  background-color: #2f3032;
  color: #e8eaed;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.custom-file-input .placeholder {
  flex-grow: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #a0a0a0;
  text-align: center; /* 讓文字置中 */
}

.placeholder.has-certificate {
  color: #e8eaed;
}

/* 統一瀏覽按鈕的樣式 */
.browse-button {
  background-color: #5f4fcc;
  font-weight: 600;
  font-size: 0.9em;
  color: #f0f0f0;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
}

.browse-button:hover {
  border-color: #7e6dd3;
  background-color: #7e6dd3;
}

/* 統一成功和錯誤訊息的樣式 */
.completion-message {
  padding: 15px;
  background-color: #4a5a4a; /* 調整成功訊息背景色 */
  color: #d4edda; /* 調整成功訊息文字顏色 */
  border: 1px solid #5a6a5a;
  border-radius: 5px;
}

.completion-message h3 {
  margin-bottom: 8px;
}

.completion-message p {
  margin-bottom: 8px;
}

.error-message {
  margin-top: 15px;
  padding: 10px;
  background-color: #6a4a4a; /* 調整錯誤訊息背景色 */
  color: #f8d7da; /* 調整錯誤訊息文字顏色 */
  border: 1px solid #7a5a5a;
  border-radius: 5px;
}
</style>
