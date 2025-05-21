import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '@/components/LoginPage.vue';
import RegisterForm from '@/components/RegisterForm.vue';
import UserDashboard from '@/components/UserDashboard.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterForm,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: UserDashboard,
    beforeEnter: (to, from, next) => {
      if (!localStorage.getItem('accessToken')) {
        next('/');
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