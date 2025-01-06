<script setup>
import { RouterLink } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'
import { computed, ref, onBeforeUnmount, onMounted } from 'vue'
const applicationStore = useApplicationStore()

const isNavbarOpen = ref(false);

const username = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.username : null,
)
const roles = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : [],
)

const toggleNavbar = () => {
  isNavbarOpen.value = !isNavbarOpen.value; // Toggle the navbar state
};
// Function to close the navbar if the screen size exceeds the breakpoint
const handleResize = () => {
  if (window.innerWidth > 768) {
    isNavbarOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <header class="navbar navbar-expand-md">
    <div class="container-fluid">
      <!-- Brand -->
      <div class="nav-brand">
        <a href="/" class="d-flex align-items-center mb-3 mb-md-0 link-body-emphasis text-decoration-none">
          <span class="fs-4 fw-bolder text-white">PreventiveHealth</span>
        </a>
      </div>

      <!-- Navbar Toggler for Small Screens -->
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-label="Toggle navigation" @click="toggleNavbar" :aria-expanded= false>
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Collapsible content -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="nav nav-pills ms-auto" id="navbarNav">
          <!-- Login Button -->
          <li class="nav-item" v-if="!applicationStore.isAuthenticated">
            <RouterLink :to="{name : 'login'}" class="nav-link fw-bolder login-button">LogIn / Register</RouterLink>
          </li>
          <li class="nav-item" v-if="applicationStore.isAuthenticated">
            <RouterLink :to="{name : 'appointments', params: {id: applicationStore.userData.id}}" class="nav-link fw-bolder login-button">Appointments</RouterLink>
          </li>
          <li class="nav-item" v-if="applicationStore.isAuthenticated">
            <RouterLink :to="{name : 'userProfile', params: {id: applicationStore.userData.id}}" class="nav-link fw-bolder login-button">Profile</RouterLink>
          </li>

          <!-- Dropdown for Logged-in User -->
          <li class="nav-item" v-if="applicationStore.isAuthenticated">
            <div class="dropdown">
              <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                Logged in as
              </button>
              <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                <li class="dropdown-item disabled text-dark">{{ username }}</li>
                <li class="dropdown-item disabled text-dark" v-for="role in roles" :key="role">{{ role }}</li>
                <li class="dropdown-divider"></li>
                <router-link :to="{ name: 'logout' }" class="nav-link text-dark">Logout</router-link>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </header>
</template>

<style scoped>

.btn{
  margin-right: 10px;
}

.login-button {
  color: black; /* Set the text color to black */
}

.register-button {
  color: whitesmoke;
}

/* Make navbar items align properly */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%; /* Full width of the screen */
  height: 60px; /* Fixed height */
  background:  linear-gradient(315deg, whitesmoke 0%, #335c81 50%);

  display: flex;
  align-items: center;
  z-index: 1030; /* Ensure it stays on top of content */
}
.nav-pills {
  justify-content: flex-end; /* Align items to the far right */
  display: flex;
  align-items: center; /* Ensure vertical alignment */
  margin-left: auto; /* Push items to the right */
  flex-wrap: nowrap; /* Prevent items from wrapping */
}

.nav-item {
  margin-left: 15px; /* Spacing between nav items */
}

.navbar-toggler-icon {
  background-color: whitesmoke;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3E%3Cpath stroke='rgba%2888, 88, 88, 0.7%29' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3E%3C/svg%3E");
}

/* Body adjustment for fixed navbar */
body {
  padding-top: 60px; /* Adjust content to avoid overlap */
}
/* Adjust padding and align text */
.nav-link {
  margin: 0 5px;
}

/* Fix dropdown alignment for Register and Logged-in dropdown */
.dropdown-menu {
  text-align: left; /* Align items inside the dropdown */
  margin: 0; /* Reset default margins */
  transform: translate(0, 0); /* Align dropdown with the button */
}

/* Style for larger screens */
@media (max-width: 768px) {
  .navbar {
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 10; /* Ensure the navbar stays above other elements */
    height: auto;
  }

  .dropdown-menu {
    position: absolute; /* Ensure dropdown appears below in small screens */
    margin-top: 10px; /* Optional: Add spacing on small screens */
    transform: none;
    top: 100%; /* Align below the button */
    left: 0; /* Align left */
    right: auto; /* Ensure dropdown doesn't push other items */
  }

  .login-button {
    color: #181818;
  }

  .nav-pills {
    display: flex;
    flex-direction: row; /* Keep items in a row */
    flex-wrap: nowrap; /* Prevent items from wrapping */
  }

  .nav-item {
    margin: 0 5px; /* Adjust spacing for smaller screens */
    width: auto; /* Ensure items don’t push others out of alignment */
  }

  /* Ensure dropdown buttons do not shift alignment */
  .dropdown-toggle {
    width: 100%; /* Ensure dropdown buttons do not shift alignment */
    text-align: center; /* Center text in dropdown buttons */ }

}

</style>
