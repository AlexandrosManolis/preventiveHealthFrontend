<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRemoteData } from '@/composables/useRemoteData.js';
import { useRoute, useRouter } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'

const route = useRoute();
const router = useRouter();

const backendEnvVar = import.meta.env.VITE_BACKEND;
const userIdRef = ref(route.params.id);
const urlRef = ref(`${backendEnvVar}/api/user/specialist/${userIdRef.value}/details`);
const authRef = ref(false);

const applicationStore = useApplicationStore();
const isAuthenticated = computed(()=>{
  return applicationStore.isAuthenticated;
});

const { performRequest, data } = useRemoteData(urlRef, authRef);

const selectedDate = ref(null);
const availableHours = ref([]);
const dayOfWeekToNumber = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6, };

const isDropdownOpen= ref([]);
const index = ref(0);
const selectedTime = ref(null);

const activeDays = computed(() =>
  (data.value?.diagnosticCenter?.schedules || []).map(
    (schedule) => dayOfWeekToNumber[schedule.dayOfWeek]
  )
);

const parseTime = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const generateTimeSlots = (schedule, isToday) => {
  const slots = [];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes() +120;
  const start = parseTime(schedule.startTime);
  const end = parseTime(schedule.endTime) - 20;

  for (let time = start; time < end; time += 30) {
    if (!isToday || time > nowMinutes) {
      const hours = Math.floor(time / 60).toString().padStart(2, '0');
      const minutes = (time % 60).toString().padStart(2, '0');
      slots.push(`${hours}:${minutes}`);
    }
  }

  return slots;
};

const handleDateClick = (day) => {
  const clickedDate = new Date(day.date);
  if (selectedDate.value?.toDateString() === clickedDate.toDateString()) {
    selectedDate.value = null;
    availableHours.value = [];
    return;
  }

  selectedDate.value = clickedDate;
  const schedule = data.value?.diagnosticCenter?.schedules?.find((s) =>
    s.dayOfWeek === clickedDate.toLocaleString('en-US', { weekday: 'long' }).toUpperCase()
  );

  selectedTime.value = null;
  const isToday = clickedDate.toDateString() === new Date().toDateString();

  if(clickedDate < new Date() && !isToday){
    availableHours.value = [];
  }else{
    availableHours.value = schedule ? generateTimeSlots(schedule, isToday) : [];
  }
};

const disabledDates = computed(() => {
  const today = new Date();
  const dates = [];

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (!activeDays.value.includes(date.getDay())) {
      dates.push(date);
    }
  }
  return dates;
});

const toggleDropdown = (index) => {
  isDropdownOpen.value[index] = !isDropdownOpen.value[index];
};

const selectTimeSlot = (time) => {
  if(selectedTime.value === time){
    selectedTime.value = null;
  }else{
    selectedTime.value = time;
  }
};
onMounted(() => {
  performRequest();
});

const goToLogin = ref(()=>{
  return router.push('/login');
});

const goBack = ref(()=>{
  return router.go(-1);
});
</script>

<template>
  <div v-if="data" class="profile-container">
    <div class="profile-header">
      <div class="user-profile">
        <h4 class="title">
          <span class="bi bi-person-vcard"></span> User Profile
        </h4>
        <p><strong>Name:</strong> {{ data.fullName }}</p>
        <p><strong>Address:</strong>
          {{ data.doctor?.address || data.diagnosticCenter?.address }},
          {{ data.doctor?.city || data.diagnosticCenter?.city }},
          {{ data.doctor?.state || data.diagnosticCenter?.state }}
        </p>
        <p><strong>Phone:</strong> {{ data.phoneNumber }}</p>
      </div>
      <div class="opening-hours">
        <h4 class="title">
          <span class="bi bi-clock"></span> Opening Hours
        </h4>
        <ul>
          <li v-for="schedule in (data.diagnosticCenter?.schedules || data.doctor?.schedules)" :key="schedule.dayOfWeek">
            <strong>{{ schedule.dayOfWeek }}:</strong> {{ schedule.startTime }} - {{ schedule.endTime }}
          </li>
        </ul>
      </div>
    </div>
    <div class="availability-container">
      <div style="text-align:center;">
        <button class="h4 dropdown-toggle" @click="toggleDropdown(index)">Available Days</button>
        <VCalendar v-model="selectedDate" :min-date="new Date()" :max-date="new Date(new Date().getFullYear(),new Date().getMonth() + 2, 0)" :attributes="[{ key: 'disabled', dates: disabledDates, popover: { visibility: 'hover' } }]" @dayclick="handleDateClick" class="dropdown-item" v-if="isDropdownOpen[index]" expanded transparent borderless/>

        <div v-if="isDropdownOpen[index]">
          <div v-if="availableHours.length" class="hours-container">
            <h5 style="margin-top: 5px; text-align: center">Available Hours:</h5>
            <div v-for="time in availableHours" :key="time" class="time-slot" @click="selectTimeSlot(time)" :class="{ selected: selectedTime === time }">{{ time }}</div>
          </div>
          <div v-else-if="selectedDate" class="no-hours">No available hours for this date.</div>
          <div v-if="!isAuthenticated">
            <button class="btn btn-secondary" style="margin-top: 2%; margin-right: 2%" @click="goBack">Back</button>
            <button class="btn btn-primary" style="margin-top: 2%" @click="goToLogin">Sign in to make an appointment</button>
          </div>
          <div v-else>
            <button class="btn btn-secondary" style="margin-top: 2%; margin-right: 2%" @click="goBack">Back</button>
            <button style="margin-top: 2%" class="btn btn-success">Send Appointment Request</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.availability-container .dropdown-item {
  max-height: 0; /* Collapsed state */
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
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

p, li {
  font-size: 1rem;
  margin: 8px 0;
  color: #555;
}

.availability-container {
  margin-top: 20px;
}

.time-slot {
  width: 60px;
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
  .opening-hours {
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
