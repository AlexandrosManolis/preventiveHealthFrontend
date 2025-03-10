import { createRouter, createWebHistory } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/admin',
      name: 'adminHome',
      component: () => import('../views/AdminHomeView.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/admin/pendingRequests',
      name: 'pendingRegisterRequests',
      component: () => import('../views/PendingRegisterRequests.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('../views/LogoutView.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/signup/patient',
      name: 'patientSignup',
      component: () => import('../views/RegisterView.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/signup/doctor',
      name: 'doctorSignup',
      component: () => import('../views/RegisterView.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/signup/diagnostic',
      name: 'diagnosticSignup',
      component: () => import('../views/RegisterView.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/user/:id/profile',
      name: 'userProfile',
      component: () => import('../views/UserProfile.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/find_specialist',
      name: 'findSpecialist',
      component: () => import('../views/FindSpecialist.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/specialist/:id/details',
      name: 'specialistDetails',
      component: () => import('../views/SpecialistDetails.vue'),
      meta: {requiresAuth: false}
    },
    {
      path: '/user/:id/appointments',
      name: 'appointments',
      component: () => import('../views/Appointments.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/user/:id/appointment/:appointmentId/details',
      name: 'appointmentDetails',
      component: () => import('../views/AppointmentDetails.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/:id/appointmentRequests',
      name: 'appointmentRequests',
      component: () => import('../views/AppointmentRequests.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/user/:id/stats',
      name: 'specialistStats',
      component: () => import('../views/SpecialistStats.vue'),
      meta: {requiresAuth: true}
    },
    {
      path: '/user/:id/preventiveCareReminder',
      name: 'preventiveCareReminder',
      component: () => import('../views/PreventiveCareReminder.vue'),
      meta: {requiresAuth: true}
    },
  ],
})

router.beforeEach((to, from, next) => {
  const { isAuthenticated } = useApplicationStore();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    console.log('User not authenticated. Redirecting to /login');
    next('/login');
  } else {
    next();
  }
});


export default router
