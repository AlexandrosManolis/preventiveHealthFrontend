<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue'
import { useApplicationStore } from '@/stores/application.js'
import { useRemoteData } from '@/composables/useRemoteData.js'

const applicationStore = useApplicationStore()
const backendEnvVar = import.meta.env.VITE_BACKEND

const pendingUserRequest = ref(false)
const rejectedUserRequest = ref(false)

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : [],
)
const username = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.username : null,
)

const checkRequestExistence = async (username, status) => {
  // Define URL and other references
  const urlRef = ref(`${backendEnvVar}/api/register-request/${status}?username=${username}`)
  const authRef = ref(true)
  const methodRef = ref('GET')

  const { performRequest} = useRemoteData(urlRef, authRef, methodRef)

  try {
    const responseData = await performRequest()

    if (responseData && responseData.exists !== undefined) {
      return { status, exists: responseData.exists }
    } else {
      return { status, exists: false }
    }
  } catch (err) {
    console.error('Request failed:', err)
    return { status, exists: false } // Fallback for errors
  }
}

const lines = ref([]);

onMounted(async () => {
  if(applicationStore.isAuthenticated && (userRole.value.includes("ROLE_DOCTOR") || userRole.value.includes("ROLE_DIAGNOSTIC"))){
    pendingUserRequest.value = await checkRequestExistence(username.value, 'pending')
    rejectedUserRequest.value = await checkRequestExistence(username.value, 'rejected')
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible"); // Add class to each line
      }
    });
  }, { threshold: 0.5 });

  lines.value = document.querySelectorAll(".line-container");
  lines.value.forEach(line => observer.observe(line));

  const cards = document.querySelectorAll('.card');
  cards.forEach(card => observer.observe(card));

  // Cleanup observer when component unmounts
  onUnmounted(() => observer.disconnect());
})

</script>

<template>
  <div style="display:flex; flex-direction: column">
    <div class="overlay" style="text-align: center">
      <img src="../assets/home-image.webp" alt="Preventive Health App Design"/>
      <h1 style="font-size: xxx-large; width: 100%">Welcome to Preventive Health</h1>
      <h5>Your preventive health care is the most important success for us</h5>
      <span style="margin-top: 15px"></span>
      <div class="scroll">
        <h5>Scroll Down</h5>
        <h1><i class="bi bi-chevron-double-down bg"></i></h1>
      </div>
    </div>
    <!-- Main Container -->
    <div class="main-container">

        <!-- Cards Container -->
        <div class="cards-container row" style="display: flex; align-items: center;">

          <!-- Animated Line -->
          <div ref="lineContainer" class="line-container">
            <svg width="60%" height="60%" viewBox="0 0 200 600">
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color: whitesmoke; stop-opacity: 1" />
                  <stop offset="45%" style="stop-color: #335c81; stop-opacity: 1" />
                </linearGradient>
              </defs>
              <path d="M100,0 V500 C100,550 200,550 200,500"
                    stroke="url(#gradient1)" fill="transparent"
                    stroke-width="5" class="animated-line"></path>
              <circle cx="100" cy="0" r="5" fill="blue"></circle>
              <circle cx="200" cy="500" r="5" fill="blue"></circle>
            </svg>

          </div>
          <RouterLink :to="{name : 'userProfile', params: {id: applicationStore.userData.id}}" class="card btn fw-bolder btn-dark"
          v-if="applicationStore.isAuthenticated">
              <div class="card-content">
                <h2>Profile</h2>
                <p>Manage your profile and personal information.</p>
              </div>
          </RouterLink>
          <RouterLink :to="{name : 'findSpecialist'}" class="card btn fw-bolder btn-dark"
          v-if="userRole.includes('ROLE_PATIENT') || !applicationStore.isAuthenticated">
            <div class="card-content">
              <h2>Find Specialist</h2>
              <p>Search for healthcare specialists in your area.</p>
            </div>
          </RouterLink>
          <RouterLink :to="{name : 'appointments', params: {id: applicationStore.userData.id}}" class="card btn fw-bolder btn-dark"
          v-if="applicationStore.isAuthenticated && !pendingUserRequest.exists && !rejectedUserRequest.exists">
            <div class="card-content">
              <h2>Appointments</h2>
              <p>Check your appointments.</p>
            </div>
          </RouterLink>
          <RouterLink :to="{name : 'appointmentRequests', params: {id: applicationStore.userData.id}}" class="card btn fw-bolder btn-dark"
          v-if="(userRole.includes('ROLE_DOCTOR') || userRole.includes('ROLE_DIAGNOSTIC')) && !pendingUserRequest.exists && !rejectedUserRequest.exists">
            <div class="card-content">
              <h2>Appointment Requests</h2>
              <p>Check your appointment requests.</p>
            </div>
          </RouterLink>
        </div>
      <div class="header" v-if="userRole.includes('ROLE_DOCTOR') || userRole.includes('ROLE_DIAGNOSTIC')">
        <div v-if="pendingUserRequest.exists">
          <h1>Your request is still in Pending status! Please come back later.</h1>
        </div>
        <div v-if="rejectedUserRequest.exists">
          <h1>Your request was rejected! Please contact us or check your email.</h1>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.main-container {
  align-content: center;
  justify-content: center;
  align-items: center;
  padding: 60px 20px 20px;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 80vh;
  min-width: 100vh;
  box-sizing: border-box;
}

/* Image Styling */
.image-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  text-align: center;
  padding-top: 60px;
  margin-bottom: 20px;
  overflow: hidden;
}
.aligned-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Cards Container Styling */
.cards-container {
  display: flex;
  gap: 20px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding-top: 20px;
  flex-wrap: nowrap;
  flex-grow: 1;
}

.card {
  flex: 1 1 300px; /* Allows cards to grow and shrink */
  max-width: 300px; /* Set max width */
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  text-align: center;
  transition: transform 0.3s ease;
}

.card-content h3 {
  margin-top: 0;
}

.faded-image {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0));
}

.card:hover {
  transform: translateY(-5px);
}

.card h2 {
  margin-bottom: 10px;
  color: #333;
}

.card p {
  color: #666;
}

.header h1 {
  justify-content: center;
  text-align: center;
  margin-top: 10px;
}

/* Responsive Adjustments */
@media (max-width: 1200px) {
  .cards-container {
    justify-content: space-around;
  }

  .card {
    max-width: 250px;
  }
}

@media (max-width: 768px) {
  .main-container{
    min-width: 0;
  }

  .cards-container {
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .card {
    flex: 1 1 100%;
    max-width: 100%;
  }
}
</style>
