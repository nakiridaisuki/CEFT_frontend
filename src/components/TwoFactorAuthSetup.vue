<template>
  <div class="two-fa-setup-container">
    <h3 class="two-fa-title">兩階段驗證 (2FA) 設定</h3>

    <div v-if="currentStep === 'initial'" class="initial-state">
      <p v-if="!hasExisting2FA" class="description-text">啟用兩階段驗證可以提高您的帳戶安全性。</p>
      <p v-else class="description-text success-text">
        <i class="fas fa-check-circle"></i> 您的帳戶已設定兩階段驗證，安全性已提高。
      </p>

      <div class="button-group">
        <button v-if="!hasExisting2FA" @click="setupTwoFa(false)" :disabled="isLoading" class="action-button setup-button">
          <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
          {{ isLoading ? '準備中...' : '設定兩階段驗證' }}
        </button>

        <template v-else>
          <button @click="confirmResetAndSetup" :disabled="isLoading" class="action-button reset-button">
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            {{ isLoading ? '重設中...' : '重設兩階段驗證' }}
          </button>
          <button @click="cancelSetup" :disabled="isLoading" class="action-button back-button">
            取消
          </button>
        </template>
      </div>
    </div>

    <div v-else-if="currentStep === 'displayQrCode'" class="two-fa-display-area">
      <p class="description-text">請使用您的驗證器應用程式（如 Google Authenticator）掃描下方 QR Code，或手動輸入密鑰。</p>

      <div class="display-flex-container">
        <div class="qr-code-wrapper">
          <img :src="qrCodeImageUrl" alt="2FA QR Code" class="qr-code-image">
        </div>

        <div class="right-content-wrapper">
          <div class="totp-secret-wrapper">
            <label for="totpSecret" class="secret-label">您的密鑰 (TOTP Secret):</label>
            <div class="secret-display">
              <span id="totpSecret" class="secret-value">{{ totpSecret }}</span>
              <button @click="copyToClipboard(totpSecret)" class="copy-button" title="複製密鑰">複製</button>
            </div>
            <p class="warning-text"><i class="fas fa-exclamation-triangle"></i> 請將此密鑰妥善保存，它用於重新設定！</p>
          </div>

          <div class="verification-input-area">
            <label for="verificationCode" class="input-label">請輸入驗證器生成的驗證碼:</label>
            <input
              type="text"
              id="verificationCode"
              v-model="verificationCode"
              placeholder="輸入 6 位數字驗證碼"
              maxlength="6"
              class="verification-input"
              :disabled="isLoading"
              @keyup.enter="verifyTwoFaCode"
            >
            <button @click="verifyTwoFaCode" :disabled="isLoading || !verificationCode.length" class="action-button verify-button">
              <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
              {{ isLoading ? '驗證中...' : '確認啟用 2FA' }}
            </button>
          </div>
        </div>
      </div>
      <button @click="backToSetup" class="action-button back-button">取消設定</button>
    </div>

    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-times-circle"></i> {{ errorMessage }}
      <button @click="clearError" class="clear-error-button">清除</button>
    </div>

    <div v-if="showResetConfirmDialog" class="confirm-dialog-overlay">
      <div class="confirm-dialog-card">
        <h3>確認重設 2FA</h3>
        <p>重設兩階段驗證將使您當前的 QR Code 和密鑰失效。您確定要繼續嗎？</p>
        <div class="dialog-actions">
          <button @click="resetAndSetup" class="action-button dialog-confirm-button">確定</button>
          <button @click="showResetConfirmDialog = false" class="action-button dialog-cancel-button">取消</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import { twofaCancel, twofaSetup, twofaVerify } from '@/services/diskService'; // 假設你的服務放在 diskService

export default {
  name: 'TwoFactorAuthSetup',
  props: {
    username: {
      type: String,
      required: true,
    },
    hasExisting2FA: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isLoading: false,
      currentStep: 'initial', // 'initial', 'displayQrCode'
      qrCodeImageUrl: null,
      totpSecret: null,
      verificationCode: '', // 用戶輸入的驗證碼
      errorMessage: null,
      showResetConfirmDialog: false,
    };
  },
  methods: {
    async setupTwoFa(reset = false) {
      this.isLoading = true;
      this.errorMessage = null;
      this.qrCodeImageUrl = null;
      this.totpSecret = null;
      this.verificationCode = ''; // 清空驗證碼輸入

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('未檢測到登入憑證，請重新登入。');
        }

        const response = await twofaSetup(token, reset);

        if (response && response.qrcode && response.totp_secret) {
          this.qrCodeImageUrl = `data:image/png;base64,${response.qrcode}`;
          this.totpSecret = response.totp_secret;
          this.currentStep = 'displayQrCode'; // 切換到顯示 QR Code 步驟
        } else {
          throw new Error('無效的 2FA 設定數據：缺少 QR Code 或密鑰。');
        }
      } catch (error) {
        console.error('設定兩階段驗證失敗:', error);
        this.errorMessage = error.message || '設定兩階段驗證失敗，請稍後再試。';
        if (error.response && error.response.status === 401) {
            this.errorMessage = '登入過期，請重新登入。';
        }
      } finally {
        this.isLoading = false;
        this.showResetConfirmDialog = false;
      }
    },

    async verifyTwoFaCode() {
      if (!this.verificationCode) {
        this.errorMessage = '請輸入驗證碼。';
        return;
      }
      if (this.verificationCode.length !== 6 || !/^\d+$/.test(this.verificationCode)) {
        this.errorMessage = '驗證碼必須是 6 位數字。';
        return;
      }

      this.isLoading = true;
      this.errorMessage = null;

      try {
        const token = await twofaVerify(this.username, this.verificationCode);

        if (token) { // 假設後端回傳 { success: true }
          localStorage.setItem('accessToken', token);
          this.$emit('twofa-change');
          this.backToSetup(); // 回到初始狀態
        } else {
          // 假設後端驗證失敗會回傳 success: false 或特定的錯誤訊息
          throw new Error(response.message || '驗證碼無效，請重試。');
        }
      } catch (error) {
        console.error('驗證兩階段驗證碼失敗:', error);
        this.errorMessage = error.message || '驗證碼驗證失敗，請檢查後重試。';
        if (error.response && error.response.status === 401) {
            this.errorMessage = '登入過期，請重新登入。';
        } else if (error.response && error.response.status === 400 && error.response.data.message === 'Invalid TOTP code') {
          this.errorMessage = '驗證碼錯誤或已過期，請重試。';
        }
      } finally {
        this.isLoading = false;
      }
    },

    confirmResetAndSetup() {
      this.showResetConfirmDialog = true;
    },
    resetAndSetup() {
      this.setupTwoFa(true);
    },
    backToSetup() {
      this.qrCodeImageUrl = null;
      this.totpSecret = null;
      this.verificationCode = ''; // 清空驗證碼
      this.errorMessage = null;
      this.currentStep = 'initial'; // 返回初始步驟
    },
    async cancelSetup() {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('未檢測到登入憑證，請重新登入。');
      }
      try {
        await twofaCancel(token);
        this.$emit('twofa-change');
        this.backToSetup();
      } catch (error) {
        console.error('兩階段驗證碼刪除失敗:', error);
        this.errorMessage = '兩階段驗證碼刪除失敗';
      }
    },
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        alert('密鑰已複製到剪貼簿！');
      } catch (err) {
        console.error('複製到剪貼簿失敗:', err);
        alert('複製失敗，請手動複製。');
      }
    },
    clearError() {
      this.errorMessage = null;
    }
  },
};
</script>

<style scoped>
/* 樣式保持不變，僅新增一個 success-text 樣式 */
.two-fa-setup-container {
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

.two-fa-title {
  font-size: 1.6em;
  font-weight: 500;
  color: #f0f0f0;
  margin-bottom: 15px;
  text-align: center;
}

.description-text {
  font-size: 0.95em;
  color: #a0a0a0;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 15px;
}

/* 新增的成功文字樣式 */
.success-text {
  color: #4CAF50; /* 綠色 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: bold;
}

.initial-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.button-group {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.action-button {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-button:hover:enabled {
  transform: translateY(-2px); /* 輕微上浮效果 */
}

.action-button:disabled {
  background-color: #555;
  color: #bbb;
  cursor: not-allowed;
}

.setup-button {
  background-color: #5f4fcc;
  color: #f0f0f0;
  border: none;
}

.setup-button:hover:enabled {
  background-color: #7e6dd3;
}

.reset-button {
  background-color: #ff4d4f;
  color: #202124;
  border: none;
}

.reset-button:hover:enabled {
  background-color: #e04446;
}

.two-fa-display-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
}

/* 新增的 Flex 容器樣式 */
.display-flex-container {
  display: flex;
  flex-direction: row; /* 預設為水平排列 */
  justify-content: center; /* 水平居中 */
  align-items: flex-start; /* 頂部對齊 */
  gap: 30px; /* 元素之間的間距 */
  width: 100%; /* 佔滿父容器寬度 */
  flex-wrap: wrap; /* 允許換行，以適應小螢幕 */
}

/* 右側內容的容器，垂直堆疊密鑰和輸入框 */
.right-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 密鑰區和輸入區的間距 */
  flex-grow: 1; /* 允許其成長以佔據剩餘空間 */
  min-width: 280px; /* 最小寬度，避免在小螢幕上過度壓縮 */
  max-width: 500px; /* 最大寬度 */
}

.qr-code-wrapper {
  background-color: #fff;
  padding: 5px;
  border-radius: 6px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  /* 確保 QR Code 區塊不會縮小太多，以保持清晰度 */
  flex-shrink: 0;
}

.qr-code-image {
  width: 300px;
  height: 300px;
  display: block;
}

.totp-secret-wrapper {
  width: 100%;
  background-color: #3c4043;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid #5f6368;
}

.secret-label {
  font-size: 0.9em;
  color: #a0a0a0;
}

.secret-display {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2em;
  font-weight: bold;
  color: #f0f0f0;
  background-color: #202124;
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
  width: 100%;
  justify-content: space-between;
}

.secret-value {
  flex-grow: 1;
  text-align: center;
}

.copy-button {
  background-color: #5f6368;
  color: #f0f0f0;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.copy-button:hover {
  background-color: #70757a;
}

.warning-text {
  font-size: 0.85em;
  color: #fdd835;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  text-align: center;
}

.warning-text i {
  color: #fdd835;
}

.back-button {
  background-color: #5f6368;
  color: #f0f0f0;
  border: none;
}

.back-button:hover:enabled {
  background-color: #70757a;
}

/* 新增的驗證碼輸入區域樣式 */
.verification-input-area {
  width: 100%;
  background-color: #3c4043;
  padding: 15px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  border: 1px solid #5f6368;
}

.input-label {
  font-size: 0.95em;
  color: #a0a0a0;
}

.verification-input {
  width: calc(100% - 20px); /* 減去 padding */
  padding: 10px;
  border: 1px solid #5f6368;
  border-radius: 4px;
  background-color: #202124;
  color: #f0f0f0;
  font-size: 1.1em;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease;
}

.verification-input:focus {
  border-color: #8ab4f8;
}

.verify-button {
  background-color: #4CAF50; /* 綠色，表示成功操作 */
  color: #202124;
  border: none;
  margin-top: 10px;
}

.verify-button:hover:enabled {
  background-color: #4CAF50;
}

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

/* 確認對話框樣式 */
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.confirm-dialog-card {
  background-color: #2f3032;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 400px;
  width: 90%;
  color: #e8eaed;
}

.confirm-dialog-card h3 {
  font-size: 1.5em;
  margin-bottom: 20px;
  color: #f0f0f0;
}

.confirm-dialog-card p {
  margin-bottom: 30px;
  color: #a0a0a0;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.dialog-confirm-button {
  background-color: #ff4d4f;
  color: white;
  border: none;
}

.dialog-confirm-button:hover:enabled {
  background-color: #e04446;
}

.dialog-cancel-button {
  background-color: #5f6368;
  color: white;
  border: none;
}

.dialog-cancel-button:hover:enabled {
  background-color: #70757a;
}

/* 響應式調整 */
@media (max-width: 800px) { /* 調整斷點以適應並排顯示 */
  .display-flex-container {
    flex-direction: column; /* 在小螢幕上改回垂直堆疊 */
    align-items: center; /* 居中對齊 */
  }

  .two-fa-setup-container {
    padding: 20px;
    margin: 15px;
  }
  .qr-code-image {
    width: 150px;
    height: 150px;
  }
  .button-group {
    flex-direction: column;
    gap: 10px;
  }
  .right-content-wrapper {
    min-width: unset; /* 在小螢幕上取消最小寬度限制 */
    width: 100%; /* 讓它佔滿寬度 */
  }
}
</style>
