<template>
  <div>
    <h2>註冊帳號</h2>
    <form @submit.prevent="register">
      <div>
        <label for="username">使用者名稱:</label>
        <input type="text" id="username" v-model="username" required>
      </div>
      <div>
        <label for="password">密碼:</label>
        <input type="password" id="password" v-model="password" required>
      </div>
      <button type="submit">註冊</button>
      <button @click="gotoSignin">登入</button>
      <p v-if="registrationError" style="color: red;">{{ registrationError }}</p>
      <p v-if="registrationSuccess" style="color: green;">註冊成功！</p>
    </form>
  </div>
</template>

<script>
import axios from 'axios'; // 確保你已安裝 axios
import { SIGNUP_URL } from '../config/apiConfig';

export default {
  name: 'RegisterForm',
  data() {
    return {
      username: '',
      password: '',
      registrationError: '',
      registrationSuccess: false,
    };
  },
  methods: {
    async register() {
      try {
        const formData = new FormData();
        formData.append('username', this.username);
        formData.append('password', this.password);
        const response = await axios.post(SIGNUP_URL, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status === 200) { // 假設後端成功註冊回傳 201 狀態碼
          this.registrationSuccess = true;
          this.registrationError = '';
          // 可以根據你的需求在這裡進行其他操作，例如導向登入頁面
          console.log('註冊成功:', response.data);
        } else {
          this.registrationError = '註冊失敗，請稍後再試。';
          this.registrationSuccess = false;
          console.error('註冊失敗:', response);
        }
      } catch (error) {
        this.registrationError = '連線錯誤或伺服器錯誤，請檢查網路或稍後再試。';
        this.registrationSuccess = false;
        console.error('註冊錯誤:', error);
      } finally {
        // 清空表單 (可選)
        this.username = '';
        this.email = '';
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
/* 你可以在這裡加入這個 component 的專屬樣式 */
label {
  display: block;
  margin-bottom: 5px;
}
input[type='text'],
input[type='email'],
input[type='password'] {
  width: 200px;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:hover {
  background-color: #0056b3;
}
</style>