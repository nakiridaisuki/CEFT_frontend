import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import RegisterForm from '@/components/RegisterForm.vue';
import UserDashboard from '@/components/UserDashboard.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterForm, // 確保你已經建立了 RegisterForm component
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: UserDashboard, // 加入 dashboard 路由
    beforeEnter: (to, from, next) => {
      if (!localStorage.getItem('accessToken')) {
        next('/'); // 如果沒有 token，導回登入頁面
      } else {
        next();
      }
    }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;