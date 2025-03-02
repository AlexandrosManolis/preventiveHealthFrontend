<script setup >
import { computed, onMounted, ref, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'
import Calendar from '@/views/Calendar.vue'
import Swal from 'sweetalert2'

const backendEnvVar = import.meta.env.VITE_BACKEND

const applicationStore = useApplicationStore()
const route = useRoute()
const router = useRouter()
const userIdRef = ref(route.params.id)
const appointmentStatus = ref(route.query.status)

const urlRef = ref(null)
const authRef = ref(true)

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
)


const defineUrl = () => {
  if (appointmentStatus.value === "completed") {
    urlRef.value = `${backendEnvVar}/api/appointment/${userIdRef.value}/medicalRecord`
  } else if (appointmentStatus.value === "uncompleted") {
    urlRef.value = `${backendEnvVar}/api/appointment/${userIdRef.value}/uncompletedAppointments`
  }
}

const { performRequest, data } = useRemoteData(urlRef, authRef)

watch(() => route.query.status, (newStatus) => {
  appointmentStatus.value = newStatus
})

onMounted(() => {
  defineUrl()
  if (urlRef.value === null) {
    return
  }
  performRequest()
})

const destroy = (appointmentId) => {
  Swal.fire({
    title: "Cause of cancelling",
    input: "text",
    inputAttributes: {
      autocapitalize: "off"
    },
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "You need to write something!";
      }
    },
    confirmButtonText: "Submit",
    showLoaderOnConfirm: true,
    preConfirm: async (causeOfRejection) => {
      try {
        urlRef.value = `${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentId}/cancel`;
        const methodRef = ref("POST");

        // Ensure `useRemoteData` can accept a body
        const bodyRef = ref(causeOfRejection.trim());

        const { performRequest } = useRemoteData(urlRef, authRef, methodRef, bodyRef);
        const response = await performRequest();

        if (typeof response === "object") {
          return response;
        }
        if (!response.ok) {
          return Swal.showValidationMessage(`${JSON.stringify(await response.json())}`);
        }
        return response.json();
      } catch (error) {
        Swal.showValidationMessage(`Request failed: ${error}`);
      }
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      return Swal.fire({
        title: "Appointment cancelled successfully",
        icon: "success"
      });
    }
  }).then(() => {
    window.location.reload();
  });
};

const goback = ()=> router.push('/');

const specialistAddress = (appointment) => {
  if (appointment.diagnosticCenter) {
    const diagnostic = appointment.diagnosticCenter;
    return `${diagnostic.address}, ${diagnostic.city}, ${diagnostic.state}`;
  } else if (appointment.doctor) {
    const doctor = appointment.doctor;
    return `${doctor.address}, ${doctor.city}, ${doctor.state}`;
  }
  return '';
};

const specialtyComputed = computed(() => {
  return data.doctor?.specialty || data.diagnosticCenter?.specialties || '';
});

const dropdowns = ref({ Past: false, Today: false, Next: false });

const today = new Date();
today.setHours(0, 0, 0, 0);

const categorizedAppointments = computed(() => {
  if (!data.value || !Array.isArray(data.value)) {
    return { Past: [], Today: [], Next: [] };
  }

  return {
    Past: data.value.filter(item => new Date(item.date) < today),
    Today: data.value.filter(item => new Date(item.date).toDateString() === today.toDateString()),
    Next: data.value.filter(item => new Date(item.date) > today),
  };
});

const untilOneHourBefore = ref(false);

untilOneHourBefore.value = (dateString, time) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime() || date.getTime() > today.getTime()) {
    return true;
  }

  const now = new Date();
  const nowToMinutes = now.getHours() * 60 + now.getMinutes();
  let timeInMinutes;

  if (typeof time === "string") {
    // Convert "HH:MM" string to total minutes
    const [hours, minutes] = time.split(":").map(Number);
    timeInMinutes = hours * 60 + minutes;
  } else if (time instanceof Date) {
    timeInMinutes = time.getHours() * 60 + time.getMinutes();
  } else {
    console.error("Invalid time format:", time);
    return false;
  }

  if(userRole.value.includes("ROLE_PATIENT") || userRole.value.includes("ROLE_ADMIN")){
    return (timeInMinutes - 60) > nowToMinutes;
  }else if(userRole.value.includes("ROLE_DIAGNOSTIC") || userRole.value.includes("ROLE_DOCTOR")){
    return (timeInMinutes - 360) > nowToMinutes;
  }
};

const toggleDropdown = (category) => {
  dropdowns.value[category] = !dropdowns.value[category];
};

const isPatient = computed(() => userRole.value.includes('ROLE_PATIENT'));
const isDiagnostic = computed(() => userRole.value.includes('ROLE_DIAGNOSTIC'));
const isDoctor = computed(() => userRole.value.includes('ROLE_DOCTOR'));
</script>

<template>
  <div v-if="data && data.length" class="appointment-container">
    <h1 style="text-align: center">Appointments</h1>
    <div class="dropdown-container">
      <template v-for="(appointments, category) in categorizedAppointments" :key="category">
        <div class="dropdown-category">
          <button class="btn btn-primary d-flex align-items-center" @click="toggleDropdown(category)">
            <strong class="text-white me-2">{{ category }} Appointments</strong>
            <span v-if="dropdowns[category]"><i class="bi bi-arrow-down-square text-dark"></i></span>
            <span v-else><i class="bi bi-arrow-right-square text-dark"></i></span>
          </button>
        <table v-show="dropdowns[category]" class="modern-table" v-if="appointments.length">
          <thead>
          <tr>
            <th>Id</th>
            <th>Date</th>
            <th>Time</th>
            <th v-if="isPatient || isDiagnostic">Appointment with specialty</th>
            <th v-if="isPatient">Address</th>
            <th v-if="isPatient">Name</th>
            <th v-if="isDiagnostic || isDoctor">Patient's Full Name</th>
            <th v-if="isDiagnostic || isDoctor">Patient's AMKA</th>
            <th>Request Status / Appointment Status</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
            <tr v-for="(data, index) in appointments" :key="index">
              <td data-label="Id">{{ data.id }}</td>
              <td data-label="Date">{{ data.date }}</td>
              <td data-label="Time">{{ data.time }}</td>
              <td v-if="isPatient || isDiagnostic" data-label="Specialty">{{ data.specialty }}</td>
              <td v-if="isPatient" data-label="Address">{{specialistAddress(data)}}
                <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specialistAddress(data))}`" target="_blank" class="bi bi-sign-turn-right" title="Open in Google Maps"></a>
              </td>
              <td v-if="isPatient" data-label="Doctor Name">{{ data.doctor?.fullName || data.diagnosticCenter?.fullName }}</td>
              <td v-if="isDiagnostic || isDoctor" data-label="Patient Name">{{ data.patient.fullName }}</td>
              <td v-if="isDiagnostic || isDoctor" data-label="AMKA">{{ data.patient.amka }}</td>
              <td class="status-container" data-label="Request Status / Appointment Status">
                <div>
                  <button class="btn btn-secondary" disabled>{{ data.appointmentRequestStatus }}</button>
                  <span style="margin: 0 5px;">/</span>
                  <button class="btn btn-secondary" disabled>{{ data.appointmentStatus }}</button>
                </div>
                <span v-if="data.appointmentStatus === 'PENDING' && category === 'Past'" class="ms-3 text-warning">
                  <i class="bi bi-exclamation-triangle"></i>
                  <span class="ms-1">Your appointment is still pending. Please cancel or complete it, or it will be deleted soon.</span>
                </span>
              </td>
              <td data-label="Actions">
                <RouterLink :to="{name:'appointmentDetails', params: {id: userIdRef, appointmentId: data.id}}" class="btn btn-primary">View Details</RouterLink>
                <button class="btn btn-danger" @click="destroy(data.id)" v-if="data.appointmentStatus !== 'CANCELLED' && untilOneHourBefore(data.date, data.time)">Cancel</button>
              </td>
            </tr>
          </tbody>
        </table>
        <table v-show="dropdowns[category]" v-else>
          <tbody>
          <tr>
            <td><strong>No appointments found</strong></td>
          </tr>
          </tbody>
        </table>

        </div>
      </template>
    </div>
  </div>
  <div v-else>
    <h1 style="text-align: center">No appointments found</h1>
  </div>

  <div v-if="data && data.length" class="calendar-container">
    <Calendar :appointments="data.map(appointment => ({ date: appointment.date, time: appointment.time, id: appointment.id }))" :specialty="specialtyComputed" calendar-type="appointments" />
  </div>
  <button @click="goback" class="btn btn-secondary">Back</button>
</template>

<style scoped>

.btn {
  margin-top: 5px;
  border: none;
  padding: 8px 12px;
  margin-right: 5px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.appointment-container {
  width: 100%;
  margin: 60px auto 0;
  padding: 20px;
}

.calendar-container {
  width: 100%;
  max-width: 100%;
  margin: 60px auto 0;
  padding: 20px;
}

.dropdown-container {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 15px;
  justify-content: center;
  z-index: 1;
  transition: all 0.25s ease-in; /* here */
  transform: translateY(-10px);
}

.dropdown-category {
  background: transparent;
  border-radius: 10px;
}

.btn-primary {
  width: 100%;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modern-table {
  width: 100%;
}

.modern-table th,
.modern-table td {
  padding: 12px;
  text-align: left;
}

.status-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .modern-table {
    display: block;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
  }

  .modern-table thead {
    display: none; /* Hide table headers */
  }

  .modern-table tbody,
  .modern-table tr,
  .modern-table td {
    display: block;
    width: 100%;
  }

  .modern-table tr {
    margin-bottom: 15px;
    border: 1px solid #ddd;
    padding: 10px;
  }

  .modern-table td {
    text-align: left;
    padding: 10px;
    position: relative;
  }

  .modern-table td::before {
    content: attr(data-label);
    font-weight: bold;
    display: block;
    text-transform: capitalize;
  }

  .status-container {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

