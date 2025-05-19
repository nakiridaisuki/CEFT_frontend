<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <router-view></router-view> </div>
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>