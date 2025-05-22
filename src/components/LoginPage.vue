<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">登入</h1>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="sr-only">帳號名稱</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="帳號名稱"
            class="form-input"
            required
            :disabled="loading || showTwoFaModal"
          />
        </div>

        <div class="form-group">
          <label for="password" class="sr-only">密碼</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="密碼"
            class="form-input"
            required
            :disabled="loading || showTwoFaModal"
          />
        </div>

        <button type="submit" class="login-button" :disabled="loading || showTwoFaModal">
          {{ loading ? '登入中...' : '登入' }}
        </button>
      </form>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div class="register-link-container">
        第一次使用？<router-link to="/register" class="register-link">註冊</router-link>
      </div>
    </div>

    <div v-if="showTwoFaModal" class="two-fa-modal-overlay">
      <div class="two-fa-modal-card">
        <h3>兩階段驗證</h3>
        <p>請輸入您的驗證器應用程式（如 Google Authenticator）生成的 6 位數字驗證碼。</p>
        <div class="form-group">
          <label for="twoFaCode" class="sr-only">驗證碼</label>
          <input
            type="text"
            id="twoFaCode"
            v-model="twoFaCode"
            placeholder="輸入 6 位數字驗證碼"
            maxlength="6"
            class="form-input two-fa-input"
            required
            @keyup.enter="handleTwoFaVerification"
            :disabled="loading"
          />
        </div>
        <div class="modal-actions">
          <button @click="handleTwoFaVerification" :disabled="loading || !twoFaCode.length" class="login-button confirm-button">
            {{ loading ? '驗證中...' : '確認' }}
          </button>
          <button @click="cancelTwoFa" :disabled="loading" class="cancel-button">
            取消
          </button>
        </div>
        <div v-if="twoFaErrorMessage" class="error-message two-fa-error">
          {{ twoFaErrorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { signin, twofaVerify } from '@/services/diskService'; // 假設你的 services 都在這裡

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      errorMessage: '',
      showTwoFaModal: false, // 控制 2FA 彈出框的顯示
      twoFaCode: '', // 儲存使用者輸入的 2FA 驗證碼
      twoFaErrorMessage: '', // 2FA 錯誤訊息
    };
  },
  methods: {
    async handleLogin() {
      this.loading = true;
      this.errorMessage = '';
      this.twoFaErrorMessage = ''; // 清除之前的 2FA 錯誤訊息
      this.showTwoFaModal = false; // 每次嘗試登入前先關閉 Modal

      try {
        const token = await signin(this.username, this.password);

        // 檢查 response 是否包含 accessToken，而不是直接檢查 token
        if (token) {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('username', this.username);
          console.log('Token 已儲存:', token);
          this.$router.push('/dashboard');
        } else {
          // 如果沒有 token 並且沒有拋出錯誤，可能是服務返回了不預期的內容
          this.errorMessage = '登入成功，但未收到有效的憑證。';
        }
      } catch (error) {
        this.loading = false; // 發生錯誤時停止 loading
        console.error('登入失敗:', error);

        // 檢查錯誤響應的狀態碼
        if (error.response && error.response.status === 302) {
          console.log("需要進行兩階段驗證。");
          this.showTwoFaModal = true; // 顯示 2FA 驗證 Modal
        } else if (error.response && error.response.data && error.response.data.message) {
          this.errorMessage = error.response.data.message;
        } else {
          this.errorMessage = error.message || '登入失敗，請稍後再試。';
        }
      } finally {
        // 在這裡不要清空 username 和 password，因為 2FA 驗證時還需要它們
        this.loading = false;
      }
    },

    async handleTwoFaVerification() {
      if (!this.twoFaCode || this.twoFaCode.length !== 6 || !/^\d+$/.test(this.twoFaCode)) {
        this.twoFaErrorMessage = '請輸入 6 位數字的有效驗證碼。';
        return;
      }

      this.loading = true;
      this.twoFaErrorMessage = '';

      try {
        // 使用之前輸入的 username 和當前的 2FA 驗證碼進行二次驗證
        const token = await twofaVerify(this.username, this.twoFaCode);

        if (token) {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('username', this.username);
          console.log('2FA 驗證成功，Token 已儲存:', token);
          this.showTwoFaModal = false; // 關閉 Modal
          this.$router.push('/dashboard');
        } else {
          this.twoFaErrorMessage = response.message || '2FA 驗證失敗，請檢查驗證碼。';
        }
      } catch (error) {
        console.error('2FA 驗證失敗:', error);
        if (error.response && error.response.data && error.response.data.message) {
          this.twoFaErrorMessage = error.response.data.message;
        } else {
          this.twoFaErrorMessage = error.message || '2FA 驗證時發生錯誤，請重試。';
        }
      } finally {
        this.loading = false;
        // 2FA 驗證完成後，清空所有輸入欄位
        this.username = '';
        this.password = '';
        this.twoFaCode = '';
      }
    },

    cancelTwoFa() {
      this.showTwoFaModal = false; // 關閉 Modal
      this.twoFaCode = ''; // 清空 2FA 驗證碼
      this.twoFaErrorMessage = ''; // 清空 2FA 錯誤訊息
      this.username = ''; // 清空帳號
      this.password = ''; // 清空密碼
      this.errorMessage = '兩階段驗證已取消。'; // 顯示一個取消訊息
    },
  },
};
</script>

<style scoped>
/* 整體背景和居中 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh; /* 確保佔據整個視窗高度 */
  background-color: #2c2c2c; /* 深灰色背景 */
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* 常用字體 */
  color: #e0e0e0; /* 淺色文字 */
}

/* 登入盒子 */
.login-box {
  background-color: #3a3a3a; /* 比背景稍淺的深灰色 */
  padding: 40px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4); /* 輕微陰影 */
  width: 100%;
  max-width: 400px; /* 最大寬度 */
  text-align: center;
}

/* 標題 */
.login-title {
  color: #f0f0f0;
  font-size: 2.2em;
  margin-bottom: 30px;
  font-weight: 600;
}

/* 表單組 */
.form-group {
  margin-bottom: 20px;
  text-align: left;
}

/* 輸入框 */
.form-input {
  width: calc(100% - 20px); /* 100% 寬度減去 padding */
  padding: 12px 10px;
  margin-top: 5px; /* 模擬 HackMD 的間距 */
  border: 1px solid #555; /* 邊框 */
  border-radius: 4px;
  background-color: #4a4a4a; /* 輸入框背景色 */
  color: #f0f0f0;
  font-size: 1em;
  outline: none; /* 移除外框 */
  transition: border-color 0.3s ease;
}

.form-input::placeholder {
  color: #bbb; /* 佔位符顏色 */
}

.form-input:focus {
  border-color: #007bff; /* 聚焦時的邊框顏色，類似藍色 */
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25); /* 輕微光暈 */
}

/* 登入按鈕 */
.login-button {
  width: 100%;
  padding: 14px 20px;
  background-color: #5f4fcc; /* 類似 HackMD 的紫色按鈕 */
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: 500;
  margin-top: 20px; /* 與輸入框的間距 */
}

.login-button:hover:enabled {
  background-color: #7e6dd3; /* 懸停時顏色變深 */
}

.login-button:active:enabled {
  transform: translateY(1px); /* 點擊時輕微下壓效果 */
}

.login-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 錯誤訊息 */
.error-message {
  color: #ff4d4f; /* 醒目的錯誤紅色 */
  margin-top: 20px;
  font-size: 0.9em;
}

.two-fa-error {
  margin-top: 15px; /* 調整 2FA 錯誤訊息的間距 */
  text-align: center;
}

/* 註冊連結容器和連結本身 */
.register-link-container {
  margin-top: 30px; /* 與按鈕的間距 */
  padding-top: 20px;
  border-top: 1px solid #4a4a4a; /* 分隔線 */
}

.register-link {
  color: #278fff; /* 連結顏色 */
  text-decoration: underline;
  font-size: 0.95em;
  transition: color 0.3s ease;
}

.register-link:hover,
.register-link:focus { /* 新增 :focus 偽類 */
  color: #7bbbff; /* 懸停時顏色變深 */
  background-color: transparent; /* **關鍵：將背景色設定為透明** */
  outline: none; /* 移除可能存在的聚焦外框 */
}

/* 隱藏元素以供螢幕閱讀器使用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* 2FA Modal 樣式 */
.two-fa-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* 半透明背景 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 確保 Modal 在最上層 */
}

.two-fa-modal-card {
  background-color: #3a3a3a;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  width: 100%;
  max-width: 380px; /* Modal 寬度 */
  text-align: center;
  color: #e0e0e0;
}

.two-fa-modal-card h3 {
  font-size: 1.8em;
  margin-bottom: 20px;
  color: #f0f0f0;
}

.two-fa-modal-card p {
  font-size: 0.95em;
  margin-bottom: 25px;
  color: #bbb;
}

.two-fa-input {
  margin-top: 10px;
  text-align: center; /* 讓 2FA 輸入框內容居中 */
  font-size: 1.2em; /* 稍微大一點的字體 */
  letter-spacing: 2px; /* 增加字母間距，方便輸入數字 */
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.confirm-button {
  background-color: #5f4fcc;
  width: auto; /* 讓按鈕寬度根據內容調整 */
  padding: 10px 25px;
  margin-top: 0; /* 覆蓋之前的 margin-top */
}

.cancel-button {
  background-color: #6c757d; /* 取消按鈕使用灰色 */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 25px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: auto;
  margin-top: 0;
}

.cancel-button:hover:enabled {
  background-color: #5a6268;
}

.cancel-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
}

</style>
