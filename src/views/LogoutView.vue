<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApplicationStore } from '@/stores/application.js';

const router = useRouter();
// Accessing the clearUserData function from the application store
const { clearUserData } = useApplicationStore();

const loading = ref(false);

// Function to handle form submission (logout)
const onFormSubmit = () => {
  // A solution is to blacklist the JWT until is expired.
  loading.value = true;
  clearUserData();
  setTimeout(function () {}, 2000); // Simulate a remote request.
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="container">

    <div class="card">
      <div class="mb-4 text-center">
        <h1 class="fs-3">Logout</h1>
      </div>
      <div class="spinner-border" role="status" v-if="loading">
        <span class="visually-hidden">Logout loading...</span>
      </div>
      <!-- Logout button -->
      <form v-else>
        <button @click="onFormSubmit" type="submit" class="btn btn-primary">
          Logout
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;

}

.btn-primary {
  width: 100%;
}

.card{
  width: 90vw; /* Dynamic width based on viewport width */
  max-width: 400px;
  padding: 20px;
  border: 1px solid #dee2e6; /* Set your desired border color */
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .card {
    width: 50vw; /* Adjust the width based on your preference */
  }
}

.mb-4 {
  margin-bottom: 1.5rem; /* Adjust margin as needed */
}

.text-center {
  text-align: center;
}

</style>
