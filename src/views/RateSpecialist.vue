<script setup>

import index from 'v-calendar'
import { computed, onMounted, ref } from 'vue'
import { useApplicationStore } from '@/stores/application.js'
import { useRoute } from 'vue-router'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Swal from 'sweetalert2'

const rating = ref(0)
const hoveredRating = ref(0)

const route = useRoute();

const dropdownIsOpen = ref([]);
const backendEnvVar = import.meta.env.VITE_BACKEND;
const userIdRef = ref(route.params.id);

const applicationStore = useApplicationStore();
const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
)

const handleDropdown = (index)=>{
  dropdownIsOpen.value[index] = !dropdownIsOpen.value[index];
};

const getRatingLabel = (rating) => {
  const labels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
  return labels[rating - 1]
}

const urlRef = ref(`${backendEnvVar}/api/user/specialist/${userIdRef.value}/rating`);
const authRef = ref(applicationStore.isAuthenticated)
const methodRef = ref("GET");
const {data, performRequest} = useRemoteData(urlRef, authRef, methodRef);

onMounted(()=>{
  performRequest();
})

const formDataRef = ref({
  rating : null,
  ratingDescription : '',
})

const onSubmit = async (event)=>{
  event.preventDefault();
  methodRef.value= "POST";
  authRef.value = true;
  const {performRequest} = useRemoteData(urlRef, authRef, methodRef, formDataRef);
  try{
    const response = await performRequest();

    if (response === null || response === undefined) {
      throw new Error("No data received from the backend.");
    }

    Swal.fire({
      title: "Rating submitted successfully",
      icon: "success"
    }).then(() => {
      window.location.reload();
    });

  }catch (err){
    throw new Error("Error: ", err);
  }
};
</script>

<template>
  <div class="doctor-score-container" style="display: flex; flex-direction: column; align-items: flex-start;" v-if="data">
    <div class="doctor-score-display" style="display: flex; flex-direction: row; align-items: center; position: relative;">
      <button class="btn" style="display: flex; flex-direction: row; align-items: center;background: none; border: none" @click="handleDropdown(index)">
        Rating:
        <span style="display: flex; flex-direction: row; gap: 4px; margin-left: 8px;">
          <span v-for="star in 5" :key="'display-'+star" class="display-star">
            <i class="bi" :class="[star <= data.averageSpecialistRating ? 'bi-star-fill' : 'bi-star']"></i>
          </span>
        </span>
        <span class="score-value" style="margin-left: 8px;">{{ data.averageSpecialistRating }}</span>
      </button>

      <!-- Rating dropdown positioned absolutely -->
      <div v-if="data && dropdownIsOpen[index]" class="doctor-rating-container dropdown-item">
        <div v-if="userRole.includes('ROLE_PATIENT') && !data.ratingExists">

          <div class="stars-container">
            <div class="stars">
            <span v-for="star in 5" :key="star" class="star-icon" :class="[star <= rating ? 'active' : '',star <= hoveredRating && hoveredRating > 0 ? 'hovered' : '']"
                  @click="rating = star; formDataRef.rating = star" @mouseenter="hoveredRating = star" @mouseleave="hoveredRating = 0">
              <i class="bi bi-star-fill"></i>
            </span>
            </div>
            <span class="rating-label" v-if="rating > 0">{{ getRatingLabel(rating) }}</span>
          </div>
          <div class="feedback-section">
            <textarea class="form-control feedback-input" rows="3" placeholder="Share your feedback about this doctor..." v-model="formDataRef.ratingDescription"></textarea>
          </div>
          <div class="action-section">
            <button class="btn submit-button" :disabled="!rating" @click="onSubmit">Submit Rating</button>
          </div>
        </div>
        <div v-if="data.ratingExists && userRole.includes('ROLE_PATIENT')" class="existing-rating-message" style="text-wrap: wrap;font-size: 16px; text-align: center">
          <span><b>You have already rated this specialist with {{ data.patientRating }}/5</b></span>
        </div>
        <RouterLink :to="{name: 'allRatings', params: {id: userIdRef}}" class="btn btn-light" style="margin-top: 10px; display: flex;align-items: center; background: transparent;justify-content: center">All Ratings</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doctor-score-container {
  position: relative;
}

.doctor-rating-container {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 24px rgba(149, 157, 165, 0.1);
  width: 200px;
  margin-top: 10px;
  max-width: 100%;
}

.stars-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.stars {
  display: flex;
  justify-content: center;
}

.star-icon {
  cursor: pointer;
  color: #e0e0e0;
  transition: all 0.2s;
  margin: 0 0.25rem;
}

.star-icon.active {
  color: #4caf50;
}

.star-icon.hovered {
  color: #81c784;
}

.rating-label {
  color: #4caf50;
  font-weight: 500;
  font-size: 1.1rem;
}

.feedback-section {
  margin-bottom: 1.5rem;
}

.feedback-input {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s;
  font-size: 1rem;
}

.feedback-input:focus {
  border-color: #4caf50;
  box-shadow: 0 0 0 0.2rem rgba(76, 175, 80, 0.2);
  outline: none;
}

.action-section {
  display: flex;
  justify-content: center;
}

.submit-button {
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 0.75rem 2.5rem;
  border-radius: 12px;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(76, 175, 80, 0.2);
}

.submit-button:hover:not(:disabled) {
  background-color: #43a047;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(76, 175, 80, 0.3);
}

.submit-button:disabled {
  background-color: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .doctor-rating-container {
    width: 100%;
    padding: 1.5rem;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
