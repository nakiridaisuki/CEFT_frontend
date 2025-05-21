<template>
  <router-view />
</template>

<script>
import { RouterLink, RouterView } from 'vue-router';
// import LoginPage from './components/LoginPage.vue'; // 根據你的實際路徑
// import RegisterForm from './components/RegisterForm.vue'; // 如果你在 App.vue 中也匯入了，可以保留

export default {
  name: 'App',
  components: {
    RouterLink,
    RouterView,
    // LoginPage, // 如果你只在路由中使用了，這裡可以移除
    // RegisterForm, // 如果你只在路由中使用了，這裡可以移除
  },
};
</script>

<style>

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%; 
  background-color: #2c2c2c; 
  overflow: hidden;
}

#app { 
  min-height: 100vh; 
  display: flex;
  flex-direction: column; 
  width: 100%;
  padding: 0; 
  overflow: hidden; 
}
</style>