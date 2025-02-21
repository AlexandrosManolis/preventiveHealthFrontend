<script setup>
import { computed, ref, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'

const route = useRoute()
const router = useRouter()
const applicationStore = useApplicationStore()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)

const isAuthenticated = computed(() => {
  return applicationStore.isAuthenticated
})
const patientId = applicationStore.userData?.id || null;

const userRole = computed(()=>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : [],
)

const { data, specialty, appointments, calendarType} = defineProps({
  data: {
    type: Object
  },
  specialty: {
    type: [String, Array]
  },
  calendarType: {
    type: String
  },
  appointments: {
    type: Array,
    default: () => []
  }
});

const formDataRef = ref({
  date: null,
  time: null,
  specialty: specialty,
  appointmentCause : '',
})

const urlRef = ref(`${backendEnvVar}/api/appointment/request/${userIdRef.value}`)
const authRef = ref(true);
const methodRef = ref("POST");

const lastSelectedDate = ref(null);

watch(() => specialty, (newSpecialty) => {
  if (newSpecialty) {
    formDataRef.value.specialty = newSpecialty;

      handleDateClick({
        date: lastSelectedDate.value // Use the stored last selected date
      });
    }
});

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

const doctorId = data?.doctor?.id;
const diagnosticCenterId = data?.diagnosticCenter?.id;

const selectedSpecialistId = doctorId ?? diagnosticCenterId;

const activeDays = computed(() =>
  (data?.diagnosticCenter?.openingHours || data?.doctor?.openingHours || []).map(
    (schedule) => dayOfWeekToNumber[schedule.dayOfWeek]
  )
);

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
    if(calendarType.includes("makeAppointment")){
      urlRef.value = `${backendEnvVar}/api/appointment/timeslots/${userIdRef.value}?date=${formattedClickedDate}&specialty=${formDataRef.value.specialty}`;
    }else if(calendarType.includes("changeAppointment")){
      urlRef.value = `${backendEnvVar}/api/appointment/timeslots/${selectedSpecialistId}?date=${formattedClickedDate}&specialty=${formDataRef.value.specialty}`;
    }
    methodRef.value = "GET";
    authRef.value = isAuthenticated.value;

    try {
      const { performRequest } = useRemoteData(urlRef, authRef, methodRef);

        performRequest()
          .then((timeSlotsData) => {
            // timeSlotsData is already parsed JSON, assign it directly
            availableHours.value = timeSlotsData || [];
          })
          .catch((error) => {
            console.error("Error fetching time slots:", error);
            alert("Something went wrong. Please try again!");
          });

      } catch (err) {
      console.error("Error during request:", err);
      alert("Something went wrong. Please try again!");
    }
  }
  lastSelectedDate.value = clickedDate;
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

const onsubmit = async (event) => {
  event.preventDefault();

  if (formDataRef.value.time != null && formDataRef.value.date != null && formDataRef.value.appointmentCause.trim() !== '') {

    try {
      if(calendarType.includes("makeAppointment")){
        urlRef.value = `${backendEnvVar}/api/appointment/request/${userIdRef.value}`;
      }else if(calendarType.includes("changeAppointment")){

        urlRef.value = `${backendEnvVar}/api/appointment/request/${selectedSpecialistId}/change`;

        formDataRef.value.id = data.id;
      }
      authRef.value = true;
      methodRef.value = "POST";

      const { performRequest } = useRemoteData(urlRef, authRef, methodRef, formDataRef);

      const response = await performRequest();
      alert(response.message);
      return router.push(`/user/${patientId}/appointments`);
    }catch (error) {
      console.error("Error during request:", error);
      alert("Something went wrong while submitting the request.");
    }
  }
};

// For storing the selected date when a user clicks
const selectedDate = ref(null)

// Filter appointments based on selected date
const selectedAppointments = computed(() => {
  if (!selectedDate.value) return [];

  const selectedFormattedDate = formatDate(selectedDate.value);
  return appointments.filter(
    (appointment) => formatDate(new Date(appointment.date)) === selectedFormattedDate
  );
});


const handleDayClick = (day) => {
  const clickedDate = new Date(day.date);
  if (selectedDate.value && formatDate(selectedDate.value) === formatDate(clickedDate)) {
    selectedDate.value = null; // Deselect if clicked again
  } else {
    selectedDate.value = clickedDate;
  }
};

const formattedAppointments = computed(() =>
  appointments.map((appointment, index) => ({
    key: `${appointment.date}-${appointment.id}`, // Unique key for each appointment
    dates: new Date(appointment.date),
    highlight: {
      color: ['purple', 'blue', 'green', 'red', 'orange'][index % 5], // Cycle through different colors
      fillMode: 'outline',
    },
    popover: {
      label: `Appointment at ${appointment.time} (ID: ${appointment.id})`,
    },
  }))
);

const goToLogin = ref(() => {
  return router.push('/login')
})

const goBack = ref(() => {
  return router.go(-1)
})
</script>

<template>
  <div>
    <div style="text-align: center" >
      <div v-if="calendarType === 'makeAppointment' || calendarType === 'changeAppointment'">
        <button class="h4 bi bi-calendar-week" @click="toggleDropdown(index)" v-if="calendarType === 'makeAppointment'">
          Available Days
        </button>
        <div style="width: 100%; margin-top: 20px;">
          <button class="h4" @click="toggleDropdown(index)" v-if="calendarType === 'changeAppointment'">
            Change Appointment
          </button>
        </div>
        <VCalendar v-model="formDataRef.date" :min-date="new Date()"
                   :max-date="new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)"
                   :attributes="[{ key: 'disabled', dates: disabledDates, popover: { visibility: 'hover' } },]"
                   calendar-type="makeAppointment"
                   v-if="isDropdownOpen[index]"
                   @dayclick="handleDateClick" class="dropdown-item" expanded transparent borderless
        />

        <div v-if="isDropdownOpen[index]">
          <div v-if="availableHours.length" class="hours-container">
            <h5 style="margin-top: 5px; text-align: center">Available Hours:</h5>
            <div v-for="time in availableHours" :key="time" class="time-slot" @click="selectTimeSlot(time)" :class="{ selected: formDataRef.time === time }">
              {{ time }}
            </div>
            <div style="margin-top: 10px">
              <label style="margin-right: 5px"><b>Appointment Cause: </b></label>
              <input type="text" v-model="formDataRef.appointmentCause" required>
            </div>
          </div>
          <div v-else-if="formDataRef.date" class="no-hours">No available hours for this date.</div>
          <div v-if="!isAuthenticated">
            <button class="btn btn-secondary" style="margin-top: 2%; margin-right: 2%" @click="goBack">Back</button>
            <button class="btn btn-primary" style="margin-top: 2%" @click="goToLogin">Sign in to make an appointment</button>
          </div>
          <div v-else>
            <button class="btn btn-secondary" style="margin-top: 2%; margin-right: 2%" @click="goBack">Back</button>
            <button style="margin-top: 2%" class="btn btn-primary" :disabled="!formDataRef.time || !formDataRef.appointmentCause.trim()" @click="onsubmit">Send Appointment Request</button>
          </div>
        </div>
      </div>

      <div v-if="calendarType === 'appointments' && (userRole.includes('ROLE_DOCTOR') || userRole.includes('ROLE_DIAGNOSTIC'))">
        <VCalendar v-model="selectedDate" color="sky-blue"
          :max-date="new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)"
          :attributes="formattedAppointments" class="dropdown-item custom-calendar max-w-full"
          expanded transparent borderless @dayclick="handleDayClick" />

        <div v-if="selectedAppointments.length">
          <h4>Appointments for {{ formatDate(selectedDate) }}</h4>
          <div v-for="appointment in selectedAppointments" :key="appointment.id" style="margin-bottom: 15px;">
            <span style="margin-right: 10px;">Appointment: {{ appointment.id }} - Time: {{ appointment.time }}</span>
            <RouterLink :to="{name:'appointmentDetails', params: {id: userIdRef, appointmentId: appointment.id}}" class="btn btn-primary">View Details</RouterLink>
          </div>
        </div>
        <div v-if="selectedDate && !selectedAppointments.length">
          <h4>No appointments found</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
@media (max-width: 480px) {
  h4.title {
    font-size: 1.2rem;
  }

  p,
  li {
    font-size: 0.85rem;
  }
}


::-webkit-scrollbar {
  width: 0px;
}

::-webkit-scrollbar-track {
  display: none;
}

:deep() .custom-calendar.vc-container {
  --day-border: 1px solid #b8c2cc;
  --day-border-highlight: 1px solid #b8c2cc;
  --day-width: 90px;
  --day-height: 90px;
  --weekday-bg: transparent;
  --weekday-border: 1px solid #eaeaea;

  border-radius: 0;
  width: 100%;

  & .vc-weeks {
    padding: 0;
  }
  & .vc-weekday {
    background-color: var(--weekday-bg);
    border-bottom: var(--weekday-border);
    border-top: var(--weekday-border);
    padding: 5px 0;
  }
  & .vc-day {
    padding: 0 5px 3px 5px;
    text-align: left;
    height: var(--day-height);
    min-width: var(--day-width);
    background-color: white;
    &.weekday-1,
    &.weekday-7 {
      background-color: transparent;
    }
    &:not(.on-bottom) {
      border-bottom: var(--day-border);
      &.weekday-1 {
        border-bottom: var(--day-border-highlight);
      }
    }
    &:not(.on-right) {
      border-right: var(--day-border);
    }
  }
  & .vc-day-dots {
    margin-bottom: 5px;
  }
}
</style>
