<script setup>
import { RouterLink, useRouter } from 'vue-router'
import {useApplicationStore} from "@/stores/application.js";
import {onBeforeMount, ref} from "vue";

const backendEnvVar = import.meta.env.VITE_BACKEND;
const router = useRouter();
// Accessing necessary functions from the application store
const { setUserData, persistUserData, isAuthenticated }= useApplicationStore();
// Creating a reactive variable for loading state
const loading = ref(false);

// Creating a reactive variable for storing user credentials
const credentials = ref({
  username: '', password:''
});
// Creating a reactive variable for tracking authentication failure
const authenticationFailed = ref(false);

// Function to handle form submission
const onFormSubmit = () => {
  loading.value = true;
  authenticationFailed.value = false;

  fetch(backendEnvVar + '/api/auth/signin', {
    method: 'Post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials.value)
  })
    .then((response) =>{
      if(response.ok){
        response.json().then((data) => {
          // Set user data in the application store
          setUserData(data);
          // Persist user data
          persistUserData(data);
          // Redirect user to the home page upon successful login
          router.push({name: 'home'});
        });
      }else {
        // Authentication failure if response is not okay
        authenticationFailed.value = true;
      }
    })
    .catch((err) => {
      console.warn(err);
      // Authentication failure if if there's an error
      authenticationFailed.value= true;

    })
    .finally(() => {
      loading.value = false;
    });
};


onBeforeMount(() => {
  if (isAuthenticated === true) {
    router.push({ name: 'home' });
  }
});
</script>


<template>
  <div class="login-container text-white">
    <h1>Sign In</h1>
    <div class="dropdown">
      <text style="margin-right: 10px">Dont have an account? Create here.</text>
      <button class="btn dropdown-toggle fw-bolder register-button text-white" type="button" id="registerDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        Register
      </button>
      <ul class="dropdown-menu" aria-labelledby="registerDropdown" style="background: whitesmoke">
        <li class="dropdown-item">
          <RouterLink :to="{ name: 'patientSignup', query: { userType: 'patient' } }" class="btn btn-secondary">Patient</RouterLink>
        </li>
        <li class="dropdown-item">
          <RouterLink :to="{ name: 'doctorSignup', query: { userType: 'doctor' } }" class="btn btn-secondary">Doctor</RouterLink>
        </li>
        <li class="dropdown-item">
          <RouterLink :to="{ name: 'diagnosticSignup', query: { userType: 'diagnostic' } }" class="btn btn-secondary">Diagnostic Center</RouterLink>
        </li>
      </ul>
    </div>
  </div>
  <div class="login-card">

    <div v-if="loading" class="loading-spinner">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <!-- Login form -->
    <form class="login-form about">

      <div class="mb-2" v-if="authenticationFailed">
        <div class="alert alert-danger" role="alert">
          Authentication failed!
        </div>
      </div>

      <!-- Username input field -->
      <div class="mb-2">
        <label for="usernameFormControl" class="form-label mb-1">Username</label>
        <input v-model="credentials.username" type="text" class="form-control" id="usernameFormControl" placeholder="Enter your username" />
      </div>

      <!-- Password input field -->
      <div class="mb-2">
        <label for="passwordFormControl" class="form-label mb-1">Password</label>
        <input v-model="credentials.password" type="password" class="form-control" id="passwordFormControl" placeholder="Enter your password"/>
      </div>

      <button @click.prevent="onFormSubmit" type="submit" class="btn btn-primary align-items-center">Login</button>
      <span class="fst-italic" v-if="credentials.username">as {{ credentials.username }}</span>

    </form>
  </div>
</template>

<style>
.btn-secondary{
  transition: transform 0.3s;
}

.btn-secondary:hover{
    transform: translateY(-2px);
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  min-height: 40vh;
  box-sizing: border-box;
  border-radius: 16px;
  background: linear-gradient(315deg, #007bff 0%,  #182b3a 80%);
  padding: 10px 15px;
  margin-top: 30px;
}

.about{
  display: flex;
  justify-content: center;
  min-height: 40vh;
  box-sizing: border-box;
  padding: 10px 15px;
  margin-top: 30px;
}

.login-card {
  width: 100%;
  max-width: 1200px;
  min-width: 500px;
  min-height: 500px;
  background: whitesmoke;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  padding: 30px;
  margin-top: 30px;
  transition: all 0.3s ease;
}

/* Style the form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Space between form elements */
  width: 100%;
  font-size: clamp(0.9rem, 1vw, 1.2rem); /* Responsive font size */
}

.header h1 {
  font-size: clamp(1.5rem, 2vw, 2rem);
  color: #2c3e50;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
}

/* Style the form heading */
.login-form h1 {
  font-size: clamp(1.5rem, 2vw, 2rem);
  text-align: center;
  margin-bottom: 1rem;
}

.login-form div {
  align-items: center;
}

/* Style the input fields */
.login-form input {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: inherit;
  transition: border-color 0.3s;
}

.form-group label {
  font-weight: 600;
  color: #34495e;
  font-size: 1rem;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #bdc3c7;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #3498db;
  outline: none;
}

@media (max-width: 768px) {
  .login-form div {
    align-items: center;
  }
  .login-card {
    min-width: 100px;
    min-height: 100px;
    max-height: 768px;
    padding: 20px;
  }
  .about {
    width: 100%;
    min-height: 100px;
    max-height: 768px;
    align-content: center;
    position: relative;
  }
}
</style>
