<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'
import Calendar from '@/views/Calendar.vue'
import RateSpecialist from '@/views/RateSpecialist.vue'

const route = useRoute()
const router = useRouter()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)
const urlRef = ref(`${backendEnvVar}/api/user/specialist/${userIdRef.value}/details`)
const authRef = ref(false)

const { performRequest, data } = useRemoteData(urlRef, authRef)

const formDataRef = ref({
  specialty: "",
})

watch(data, (newData) => {
  if (!formDataRef.value.specialty) {
    // If route.query.specialty is valid and matches one of the specialties
    if (route.query.specialty !== "all" && newData.diagnosticCenter?.specialties?.includes(route.query.specialty)) {
      formDataRef.value.specialty = route.query.specialty;
    }
    // If query specialty doesn't match or is "all", set the first specialty
    else if (route.query.specialty && newData.diagnosticCenter?.specialties?.length) {
      formDataRef.value.specialty = newData.diagnosticCenter?.specialties[0];
    }
    // If there's no match in specialties, fallback to the first one
    else if (newData.diagnosticCenter?.specialties?.length) {
      formDataRef.value.specialty = newData.diagnosticCenter?.specialties[0];
    }
    // Fallback to doctor's specialty if available
    else if (newData.doctor?.specialty) {
      formDataRef.value.specialty = newData.doctor.specialty;
    }
  }
});

watch(() => formDataRef.value.specialty, (newValue) => {
  if (newValue) {
    router.push({
      name: route.name,
      params: route.params,
      query: { ...route.query, specialty: newValue },
    });
  }
});

onMounted(() => {
  performRequest();
});

const goback = () => router.push('/find_specialist');
</script>

<template>
  <div v-if="data && data.registerRequest.status === 'ACCEPTED'" class="profile-container">

    <div class="profile-header">
      <div class="user-profile">
        <h4 class="title"><span class="bi bi-person-vcard"></span> User Profile</h4>
        <p><strong>Name:</strong> {{ data.fullName }}</p>
        <p>
          <strong>Address:</strong> {{(specialistAddress = `${data.doctor?.address || data.diagnosticCenter?.address}, ${data.doctor?.city || data.diagnosticCenter?.city}, ${data.doctor?.state || data.diagnosticCenter?.state}`) }}
          <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specialistAddress)}`" target="_blank" class="bi bi-sign-turn-right" title="Open in Google Maps"></a>
        </p>
        <p><strong>Phone:</strong> {{ data.phoneNumber }}</p>
      </div>
      <div class="opening-hours">
        <h4 class="title"><span class="bi bi-clock"></span> Opening Hours</h4>
        <ul>
          <li v-for="openingHour in data.diagnosticCenter?.openingHours || data.doctor?.openingHours"
            :key="openingHour.dayOfWeek">
            <strong>{{ openingHour.dayOfWeek }}:</strong> {{ openingHour.startTime }} -
            {{ openingHour.endTime }}
          </li>
        </ul>
      </div>

      <div class="dropdown-container">
        <div v-if="data.diagnosticCenter">
          <h4 class="title">Diagnostic Center Specialty</h4>
          <select class="form-select " v-model="formDataRef.specialty">
            <option v-for="(specialty, index) in data.diagnosticCenter?.specialties" :key="index" :value="specialty" :selected="specialty === formDataRef.specialty">
              {{ specialty }}
            </option>
          </select>
        </div>

        <div v-if="data.doctor" >
          <h4 class="title">Doctor Specialty</h4>
          <select class="form-select" v-model="formDataRef.specialty" disabled>
            <option v-for="(specialty, index) in [data.doctor?.specialty]" :key="index" :value="specialty" :selected="specialty === formDataRef.specialty">
              {{ specialty }}
            </option>
          </select>
        </div>
      </div>
      <RateSpecialist/>
    </div>
    <div>
      <Calendar :data="data" :specialty="formDataRef.specialty" calendar-type="makeAppointment"/>
    </div>
  </div>

  <div class="user-profile align-items-center text-center" style="margin-top: 60px" v-else>
    <h1>This doctor will be joining the platform shortly!</h1>
    <button @click="goback" class="btn btn-secondary">Back</button>
  </div>
</template>

<style scoped>

.dropdown-container{
  padding: 20px;
  border-radius: 8px;
  flex: 1 1 50%;
  min-width: 400px;
  box-sizing: border-box;
}

.form-select{
  width: auto;
}

.availability-container .dropdown-item.open {
  max-height: 500px; /* Arbitrary large value that fits the content */
  opacity: 1; /* Fully visible */
  padding: 10px; /* Add padding for expanded state */
}

.profile-container {
  line-height: 40px;
  height: auto;
  padding: 20px;
  border-radius: 10px;
  max-width: 1400px;
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
}

.profile-header {
  display: flex;
  gap: 20px;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: nowrap;
}

.user-profile,
.opening-hours {
  padding: 20px;
  border-radius: 8px;
  flex: 1 1 50%;
  min-width: 400px;
  box-sizing: border-box;
}

h4.title {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #333;
}

p,
li {
  font-size: 1rem;
  margin: 8px 0;
  color: #555;
}

@media (max-width: 992px) {
  .profile-header {
    flex-wrap: wrap;
    gap: 10px;
  }

  .user-profile,
  .opening-hours
  .dropdown-container{
    flex: 1 1 100%;
  }
}

@media (max-width: 480px) {
  h4.title {
    font-size: 1.2rem;
  }

  p,
  li {
    font-size: 0.85rem;
  }
}
</style>
