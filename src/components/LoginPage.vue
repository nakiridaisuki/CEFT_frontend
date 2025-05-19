<template>
  <div class="login-container">
    <h2>登入</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">使用者名稱:</label>
        <input type="text" id="username" v-model="username" required :disabled="loading" />
      </div>
      <div class="form-group">
        <label for="password">密碼:</label>
        <input type="password" id="password" v-model="password" required :disabled="loading" />
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? '登入中...' : '登入' }}
      </button>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    </form>
    <button @click="goToRegister" class="register-button">前往註冊</button>
  </div>
</template>

<script>
import axios from 'axios'; // 1. 匯入 axios
import { SIGNIN_URL } from '../config/apiConfig';

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      loading: false, // 2. 新增 loading 狀態，用於處理請求過程中的 UI 反應
      errorMessage: '', // 3. 新增 errorMessage，用於顯示 API 錯誤訊息
      successMessage: '', // 用於顯示成功訊息
    };
  },
  methods: {
    async handleLogin() { // 4. 將方法改為 async 以便使用 await
      this.loading = true; // 開始請求，設定 loading 為 true
      this.errorMessage = ''; // 清除先前的錯誤訊息
      this.successMessage = ''; // 清除先前的成功訊息

      try {
        // 5. 發送 POST 請求到你的 API 端點
        const formData = new FormData();
        formData.append('username', this.username);
        formData.append('password', this.password);
        const response = await axios.post(SIGNIN_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // 6. 處理成功的 API 回應
        this.loading = false;
        this.successMessage = '登入成功！';
        console.log('API 回應:', response.data);

        // 假設 API 回應中包含 token
        const token = response.data.data.accessToken;
        if (token) {
          localStorage.setItem('accessToken', token);
          localStorage.setItem('username', this.username);
          console.log('Token 已儲存:', token);
          this.$router.push('/dashboard');
        } else {
          this.errorMessage = '登入成功，但未收到 token。';
        }

        // 清空表單 (可選)
        // this.username = '';
        // this.password = '';

      } catch (error) {
        // 7. 處理 API 錯誤
        this.loading = false;
        if (error.response) {
          // API 回應了錯誤狀態碼 (例如 400, 401, 500)
          this.errorMessage = '登入失敗，請檢查你的帳號或密碼。';
          console.error('API 錯誤回應:', error.response.data);
        } else if (error.request) {
          // 請求已發出，但沒有收到回應 (例如網路問題)
          this.errorMessage = '無法連接到伺服器，請檢查你的網路連線。';
          console.error('API 無回應:', error.request);
        } else {
          // 設定請求時發生了其他錯誤
          this.errorMessage = '發生未知錯誤，請稍後再試。';
          console.error('請求設定錯誤:', error.message);
        }
      }
    },
    goToRegister() {
      console.log("HI");
      this.$router.push('/register');
    }
  },
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: sans-serif;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
}

.form-group input {
  width: calc(100% - 22px); /* 調整以適應 padding 和 border */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-top: 10px;
  text-align: center;
}

.success-message {
  color: green;
  margin-top: 10px;
  text-align: center;
}
</style>