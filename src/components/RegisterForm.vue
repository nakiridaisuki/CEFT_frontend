<template>
  <div class="register-container">
    <div class="register-box">
      <h1 class="register-title">註冊</h1>

      <form @submit.prevent="handleRegister" class="register-form">
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
          <p class="input-description">請輸入您的帳號名稱</p>
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
          <p class="input-description">請輸入您的密碼</p>
        </div>

        <button type="submit" class="register-button" :disabled="loading">
          {{ loading ? '註冊中...' : '註冊' }}
        </button>
      </form>

      <div v-if="registrationError" class="error-message">
        {{ registrationError }}
      </div>

      <div class="login-link-container">
        已經有帳號了？<router-link to="/login" class="login-link">登入</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { signup, signin } from '@/services/diskService';

export default {
  name: 'RegisterForm',
  data() {
    return {
      username: '',
      password: '',
      registrationError: '',
      registrationSuccess: false,
      loading: false,
    };
  },
  methods: {
    async handleRegister() {
      this.loading = true;
      try {
        await signup(this.username, this.password);
        this.loading = false;
        this.registrationSuccess = true;
        this.registrationError = '';

        const token = await signin(this.username, this.password);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('username', this.username);
        console.log('Token 已儲存:', token);
        this.$router.push('/dashboard');
      } catch (error) {
        this.registrationError = '註冊失敗，請稍後再試。';
        this.registrationSuccess = false;
        console.error('註冊失敗:', error);
      } finally {
        this.username = '';
        this.password = '';
      }
    },
    gotoSignin() {
      this.$router.push('/');
    }
  },
};
</script>

<style scoped>
/* 整體背景和居中 - 與 Login.vue 相同 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #2c2c2c;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #e0e0e0;
}

/* 註冊盒子 - 與 Login.vue 相同，但類名為 register-box */
.register-box {
  background-color: #3a3a3a;
  padding: 40px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

/* 標題 - 與 Login.vue 相同，但類名為 register-title */
.register-title {
  color: #f0f0f0;
  font-size: 2.2em;
  margin-bottom: 30px;
  font-weight: 600;
}

/* 表單組 - 與 Login.vue 相同 */
.form-group {
  margin-bottom: 20px;
  text-align: left;
}

/* 輸入框 - 與 Login.vue 相同 */
.form-input {
  width: calc(100% - 20px);
  padding: 12px 10px;
  margin-top: 5px;
  border: 1px solid #555;
  border-radius: 4px;
  background-color: #4a4a4a;
  color: #f0f0f0;
  font-size: 1em;
  outline: none;
  transition: border-color 0.3s ease;
}

.form-input::placeholder {
  color: #bbb;
}

.form-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

/* 輸入框說明文字 */
.input-description {
  color: #a0a0a0; /* 較淺的灰色 */
  font-size: 0.85em;
  margin-top: 5px; /* 與輸入框的間距 */
  margin-left: 10px; /* 稍微向右縮進 */
}

/* 註冊按鈕 - 與 Login.vue 的 login-button 相同，但類名為 register-button */
.register-button {
  width: 100%;
  padding: 14px 20px;
  background-color: #5f4fcc;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;
  font-weight: 500;
  margin-top: 20px;
}

.register-button:hover {
  background-color: #7e6dd3;
}

.register-button:active {
  transform: translateY(1px);
}

.register-button:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 錯誤訊息 - 與 Login.vue 相同 */
.error-message {
  color: #ff4d4f;
  margin-top: 20px;
  font-size: 0.9em;
}

/* 登入連結容器和連結本身 - 類似 Login.vue 的 register-link，但類名為 login-link */
.login-link-container {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #4a4a4a;
}

.login-link {
  color: #278fff;
  text-decoration: underline; /* 加上底線，可以根據你的喜好調整 */
  font-size: 0.95em;
  transition: color 0.3s ease;

  /* 移除預設的背景和輪廓，與 Login.vue 的 register-link 保持一致 */
  background-color: transparent;
  outline: none;
}

.login-link:hover {
  color: #7bbbff;
  background-color: transparent; /* 再次確認懸停時背景透明 */
}

.login-link:active,
.login-link:focus {
  outline: none;
  background-color: transparent;
  box-shadow: none;
}

/* 隱藏元素以供螢幕閱讀器使用 - 與 Login.vue 相同 */
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