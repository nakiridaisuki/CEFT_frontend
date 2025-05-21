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
          />
        </div>

        <button type="submit" class="login-button" :disabled="loading">
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
  </div>
</template>

<script>
import { signin } from '@/services/diskService';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      errorMessage: '',
    };
  },
  methods: {
    async handleLogin() { 
      this.loading = true;
      this.errorMessage = '';

      try {
        const token = await signin(this.username, this.password);
        this.loading = false;
        
        if (token) {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('username', this.username);
          console.log('Token 已儲存:', token);
          this.$router.push('/dashboard');
        } else {
          this.errorMessage = '登入成功，但未收到 token。';
        }
      } catch (error) {
        this.errorMessage = error.message;
      } finally {
        this.username = '';
        this.password = '';
        this.loading = false;
      }
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

.login-button:hover {
  background-color: #7e6dd3; /* 懸停時顏色變深 */
}

.login-button:active {
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
</style>