<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'

const route = useRoute()
const router = useRouter()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)
const urlRef = ref(`${backendEnvVar}/api/user/specialist/${userIdRef.value}/details`)
const authRef = ref(false)

const applicationStore = useApplicationStore()
const isAuthenticated = computed(() => {
  return applicationStore.isAuthenticated
})
const patientId = applicationStore.userData.id;
const { performRequest, data } = useRemoteData(urlRef, authRef)

const formDataRef = ref({
  date: null,
  time: null,
  specialty: "",
})

const availableHours = ref([])
const dayOfWeekToNumber = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
}

const isDropdownOpen = ref([])
const index = ref(0)

const activeDays = computed(() =>
  (data.value?.diagnosticCenter?.openingHours || data.value?.doctor?.openingHours || []).map(
    (schedule) => dayOfWeekToNumber[schedule.dayOfWeek],
  ),
)

const formatDate = (date) =>{
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const handleDateClick = (day) => {
  const clickedDate = new Date(day.date);

  const formattedClickedDate = formatDate(clickedDate);
  const isDisabled = disabledDates.value.some(
    (disabledDate) => disabledDate.toDateString() === clickedDate.toDateString()
  );
  if (isDisabled) {
    availableHours.value = [];
    return;
  }

  if (formDataRef.value.date === formattedClickedDate) {
    formDataRef.value.date = null;
    availableHours.value = [];
    return;
  }

  formDataRef.value.date = formattedClickedDate;

  formDataRef.value.time = null;
  const isToday = clickedDate.toDateString() === new Date().toDateString();

  // Handle disabling past dates if the selected date is earlier than today
  if (clickedDate < new Date() && !isToday) {
    availableHours.value = [];
  } else {
    fetch(`${backendEnvVar}/api/appointment/timeslots/${userIdRef.value}?date=${formattedClickedDate}`)
      .then((response) => {
        if (!response.ok) {
          // Extract the message from the response
          return response.text().then((message) => {
            alert(`Error: ${message}`);
            throw new Error(message);
          });
        }
        return response.json();
      })
      .then((timeSlotsData) => {
        availableHours.value = timeSlotsData || [];
      })
      .catch((error) => {
        console.error("Error fetching time slots:", error);
      });

  }
};

const disabledDates = computed(() => {
  const today = new Date()
  const dates = []

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    if (!activeDays.value.includes(date.getDay())) {
      dates.push(date)
    }
  }
  return dates
})

const toggleDropdown = (index) => {
  isDropdownOpen.value[index] = !isDropdownOpen.value[index]
}

const selectTimeSlot = (time) => {
  formDataRef.value.time = formDataRef.value.time === time ? null : time;
};


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

watch(formDataRef.value.specialty, (newValue)=>{
  if(newValue){
    router.push({
      name: route.name,
      params: route.params,
      query: { ...route.query, specialty: newValue },
    });
  }
});

onMounted(() => {
  performRequest();
})

const onsubmit = async (event) => {
  event.preventDefault();

  if (formDataRef.value.time != null && formDataRef.value.date != null) {

    urlRef.value = `${backendEnvVar}/api/appointment/request/${userIdRef.value}`;
    const methodRef = ref("POST");
    authRef.value = true;
    const { performRequest } = useRemoteData(urlRef, authRef, methodRef, formDataRef);

    try {
      const response = await performRequest();
      alert(response.message);
      return router.push(`/user/${patientId}/appointments`);
    }catch (error) {
      console.error("Error during request:", error);
      alert("Something went wrong while submitting the request.");
    }
  }
};

const goToLogin = ref(() => {
  return router.push('/login')
})

const goBack = ref(() => {
  return router.go(-1)
})
</script>

<template>
  <div v-if="data && data.registerRequest.status === 'ACCEPTED'" class="profile-container">

    <div class="profile-header">
      <div class="user-profile">
        <h4 class="title"><span class="bi bi-person-vcard"></span> User Profile</h4>
        <p><strong>Name:</strong> {{ data.fullName }}</p>
        <p>
          <strong>Address:</strong> {{ data.doctor?.address || data.diagnosticCenter?.address }},
          {{ data.doctor?.city || data.diagnosticCenter?.city }},
          {{ data.doctor?.state || data.diagnosticCenter?.state }}
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
    </div>

    <div class="availability-container">
      <div style="text-align: center">
        <button class="h4 bi bi-calendar-week" @click="toggleDropdown(index)">
          Available Days
        </button>
        <VCalendar v-model="formDataRef.date" :min-date="new Date()"
          :max-date="new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)"
          :attributes="[{ key: 'disabled', dates: disabledDates, popover: { visibility: 'hover' } },]"
          @dayclick="handleDateClick" class="dropdown-item" v-if="isDropdownOpen[index]" expanded transparent borderless
        />

        <div v-if="isDropdownOpen[index]">
          <div v-if="availableHours.length" class="hours-container">
            <h5 style="margin-top: 5px; text-align: center">Available Hours:</h5>
            <div v-for="time in availableHours" :key="time" class="time-slot" @click="selectTimeSlot(time)" :class="{ selected: formDataRef.time === time }">
              {{ time }}
            </div>
          </div>
          <div v-else-if="formDataRef.date" class="no-hours">No available hours for this date.</div>
          <div v-if="!isAuthenticated">
            <button class="btn btn-secondary" style="margin-top: 2%; margin-right: 2%" @click="goBack">
              Back
            </button>
            <button class="btn btn-primary" style="margin-top: 2%" @click="goToLogin">
              Sign in to make an appointment
            </button>
          </div>
          <div v-else>
            <button class="btn btn-secondary" style="margin-top: 2%; margin-right: 2%" @click="goBack">
              Back
            </button>
            <button style="margin-top: 2%" class="btn btn-primary" :disabled="!formDataRef.time" @click="onsubmit">
              Send Appointment Request
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="user-profile align-items-center text-center" style="margin-top: 60px" v-else>
    <h1>This doctor will be joining the platform shortly!</h1>
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

.availability-container .dropdown-item {
  max-height: 0; /* Collapsed state */
  overflow: hidden;
  opacity: 0; /* Initially hidden */
  padding: 0; /* Prevent extra padding when collapsed */
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

.availability-container {
  margin-top: 20px;
}

.time-slot {
  width: auto;
  text-align: center;
  display: inline-block;
  margin: 2px 5px;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
}

.time-slot.selected {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
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
