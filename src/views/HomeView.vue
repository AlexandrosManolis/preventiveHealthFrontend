<script setup>
import {ref, computed, onMounted} from 'vue'
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

  const { performRequest, data, error } = useRemoteData(urlRef, authRef, methodRef)

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

onMounted(async () => {
  pendingUserRequest.value = await checkRequestExistence(username.value, 'pending')
  rejectedUserRequest.value = await checkRequestExistence(username.value, 'rejected')
})


</script>

<template>
  <div>
    <!-- Main Container -->
    <div class="main-container">

      <div class="image-container">
        <img src="@/assets/preventivehealth.webp" alt="Preventive Health App Design" class="aligned-image faded-image" />
      </div>

        <!-- Cards Container -->
        <div class="cards-container row">
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
          <RouterLink :to="{name : 'appointments'}" class="card btn fw-bolder btn-dark"
          v-if="(userRole.includes('ROLE_DOCTOR') || userRole.includes('ROLE_DIAGNOSTIC')) && !pendingUserRequest.exists && !rejectedUserRequest.exists">
            <div class="card-content">
              <h2>Appointments</h2>
              <p>Check your appointments.</p>
            </div>
          </RouterLink>
          <RouterLink :to="{name : 'appointmentRequests'}" class="card btn fw-bolder btn-dark"
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
    flex: 1 1 100%; /* Full width on small screens */
    max-width: 100%; /* Remove max width on small screens */
  }
}
</style>
