<template>
  <div class="request-certificate-container">
    <h3 class="certificate-title">申請憑證</h3>
    <div v-if="!certificate" class="initial-state">
      <button @click="generateAndRequestCertificate" :disabled="generatingOrRequesting" class="action-button setup-button">
        <i v-if="generatingOrRequesting" class="fas fa-spinner fa-spin"></i>
        {{ generatingOrRequesting ? '產生金鑰並請求憑證中...' : '生成並請求憑證' }}
      </button>
      <p v-if="error" class="error-message">
        <i class="fas fa-times-circle"></i> {{ error }}
        <button @click="clearError" class="clear-error-button">清除</button>
      </p>
    </div>
    <div v-if="certificate" class="certificate-display-area">
      <h3 class="certificate-title success-text">
        <i class="fas fa-check-circle"></i> 憑證已簽發
      </h3>

      <div class="keys-and-certs-flex-container">
        <div class="key-display-wrapper">
          <p class="label-text"><strong>私鑰 (請務必安全保存):</strong></p>
          <textarea rows="5" cols="60" readonly class="code-textarea">{{ privateKey }}</textarea>
          <button @click="downloadPrivateKey" class="action-button download-button">下載私鑰</button>
        </div>

        <div class="key-display-wrapper">
          <p class="label-text"><strong>數位憑證:</strong></p>
          <textarea rows="10" cols="60" readonly class="code-textarea">{{ certificate }}</textarea>
          <div class="button-group-horizontal"> <button @click="downloadAndSaveCertificate" class="action-button download-button">儲存並下載憑證</button>
            <button @click="downloadCertificate" class="action-button download-button">下載憑證</button>
          </div>
        </div>
      </div>

      <p v-if="downloadError" class="error-message">
        <i class="fas fa-times-circle"></i> {{ downloadError }}
        <button @click="clearDownloadError" class="clear-error-button">清除</button>
      </p>
    </div>
  </div>
</template>

<script>
import { generateRSAPemKey } from '@/utils/crypto';
import { requestCertificate } from '@/services/kmsService';

export default {
  name: 'RequestCertificate',
  props: {
    username: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      publicKey: null,
      privateKey: null,
      certificate: '',
      generatingOrRequesting: false,
      error: null,
      downloadError: null,
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

        // 將 privateKey 儲存到 localStorage
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
      this.downloadFile(`${this.username}_certificate.pem`, this.certificate, 'text/plain');
    },
    downloadAndSaveCertificate() {
      if (!this.certificate) {
        this.downloadError = '憑證尚未簽發。';
        return;
      }
      localStorage.setItem('userCertificate', this.certificate);
      this.$emit('certificateSaved'); // 發出事件通知父元件憑證已儲存
      this.downloadFile(`${this.username}_certificate.pem`, this.certificate, 'text/plain');
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
    clearError() {
      this.error = null;
    },
    clearDownloadError() {
      this.downloadError = null;
    }
  },
};
</script>

<style scoped>
/* 容器樣式 - 與 TwoFactorAuthSetup 的 .two-fa-setup-container 相似 */
.request-certificate-container {
  background-color: #2f3032;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  color: #e8eaed;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 80%;
  margin: 20px auto;
}

/* 標題樣式 - 與 TwoFactorAuthSetup 的 .two-fa-title 相似 */
.certificate-title {
  font-size: 1.6em;
  font-weight: 500;
  color: #f0f0f0;
  margin-bottom: 15px;
  text-align: center;
}

/* 初始狀態容器 */
.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

/* 按鈕樣式 - 與 TwoFactorAuthSetup 的 .action-button 相似 */
.action-button {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center; /* 新增：水平居中內容 */
  gap: 8px;
  /* 新增：固定高度 */
  height: 40px; /* 設定一個固定的按鈕高度 */
}

.action-button:hover:enabled {
  transform: translateY(-2px); /* 輕微上浮效果 */
}

.action-button:disabled {
  background-color: #555;
  color: #bbb;
  cursor: not-allowed;
}

/* 設定按鈕顏色 - 與 TwoFactorAuthSetup 的 .setup-button 相似 */
.setup-button {
  background-color: #5f4fcc;
  color: #f0f0f0;
  border: none;
}

.setup-button:hover:enabled {
  background-color: #7e6dd3;
}

/* 下載按鈕顏色 - 類似 TwoFactorAuthSetup 的 .back-button 或 .copy-button */
.download-button {
  background-color: #5f6368;
  color: #f0f0f0;
  border: none;
}

.download-button:hover:enabled {
  background-color: #70757a;
}

/* 憑證顯示區域 */
.certificate-display-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  height: 100%;
}

/* 新增的 Flex 容器，用於讓私鑰和憑證顯示框並排 */
.keys-and-certs-flex-container {
  display: flex;
  flex-direction: row; /* 預設為水平排列 */
  justify-content: center; /* 水平居中 */
  align-items: stretch; /* 新增：讓子項目拉伸以填充容器的高度 */
  gap: 20px; /* 元素之間的間距 */
  width: 100%; /* 佔滿父容器寬度 */
  /* height: 380px; 移除固定高度，讓內容決定高度 */
  flex-wrap: wrap; /* 允許換行，以適應小螢幕 */
}

/* 私鑰/憑證顯示區塊的容器 */
.key-display-wrapper {
  background-color: #3c4043;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid #5f6368;
  flex: 1; /* 讓它們均勻分佈可用空間 */
  /* height: 100%; 移除或修改此屬性，讓它彈性填充 */
  min-width: 300px; /* 設置最小寬度，避免在小螢幕上過度壓縮 */
}

/* 私鑰/憑證的標籤文本 */
.label-text {
  font-size: 1em;
  color: #c9c9c9;
  margin-bottom: 5px; /* 與 textarea 之間的間距 */
  text-align: center;
}

/* 文本區域樣式 - 類似 TwoFactorAuthSetup 的 .secret-display */
.code-textarea {
  width: calc(100% - 20px); /* 減去 padding */
  padding: 10px;
  border: 1px solid #5f6368;
  border-radius: 4px;
  background-color: #202124;
  color: #f0f0f0;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; /* 保持等寬字體 */
  font-size: 0.9em;
  line-height: 1.5;
  resize: vertical; /* 允許垂直拖曳改變大小 */
  box-sizing: border-box; /* 確保 padding 和 border 包含在寬度內 */
  margin-bottom: 5px; /* 為按鈕組留出空間 */
  flex-grow: 1; /* 新增：允許文本區域彈性成長，佔據可用空間 */
  min-height: 150px; /* 新增：設置一個最小高度，避免太小 */
}

.code-textarea:focus {
  border-color: #8ab4f8;
  outline: none;
}

/* 新增的按鈕組 Flex 容器，用於讓憑證的兩個按鈕並排 */
.button-group-horizontal {
  display: flex;
  gap: 10px; /* 按鈕之間的間距 */
  justify-content: center; /* 水平居中 */
  width: 100%;
  flex-wrap: wrap; /* 允許按鈕換行，以適應小螢幕 */
}

/* 成功訊息樣式 - 與 TwoFactorAuthSetup 的 .success-text 相似 */
.success-text {
  color: #4CAF50; /* 綠色 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
  margin-bottom: 20px; /* 給憑證已簽發標題一些底部間距 */
}

/* 錯誤訊息樣式 - 與 TwoFactorAuthSetup 的 .error-message 相似 */
.error-message {
  color: #ff4d4f;
  font-size: 0.9em;
  margin-top: 15px;
  padding: 10px 15px;
  background-color: #3c4043;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: space-between;
}

.error-message i {
  color: #ff4d4f;
}

.clear-error-button {
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  font-size: 0.8em;
  margin-left: auto;
}

.clear-error-button:hover {
  color: #f0f0f0;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .request-certificate-container {
    padding: 20px;
    margin: 15px;
    max-width: 95%; /* 小螢幕下佔用更多寬度 */
  }

  .keys-and-certs-flex-container {
    flex-direction: column; /* 在小螢幕上將顯示框改為垂直堆疊 */
    align-items: center; /* 居中對齊 */
  }

  .key-display-wrapper {
    min-width: unset; /* 在小螢幕上取消最小寬度限制 */
    width: 100%; /* 讓它佔滿寬度 */
  }

  .button-group-horizontal {
    flex-direction: column; /* 在小螢幕上將按鈕改為垂直堆疊 */
    gap: 5px; /* 調整間距 */
  }

  /* 調整小螢幕下按鈕的寬度，讓它們更適合垂直堆疊 */
  .button-group-horizontal .action-button {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}
</style>
