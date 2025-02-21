<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Calendar from '@/views/Calendar.vue'
import { useApplicationStore } from '@/stores/application.js'
import Swal from 'sweetalert2'

const route = useRoute()
const router = useRouter()
const applicationStore = useApplicationStore()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)
const appointmentIdRef = ref(route.params.appointmentId)

const urlRef = ref(
  `${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentIdRef.value}/details`,
)
const authRef = ref(true)

const { performRequest, data } = useRemoteData(urlRef, authRef)

onMounted(() => {
  performRequest()
})

const goBack = () => {
  return router.push(`/user/${userIdRef.value}/appointments`)
}

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

const untilOneHourBefore = ref(false);

untilOneHourBefore.value = (dateString, time) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0,0,0,0);

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

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
)
</script>

<template>
  <div class="table-container">
    <div v-if="data">
      <h1 class="text-center">Appointment Details</h1>
      <table class="appointment-table">
        <tbody>
        <tr>
          <th>Id</th>
          <td>{{ data.id }}</td>
        </tr>
        <tr>
          <th>Name</th>
          <td>{{ data.doctor?.fullName || data.diagnosticCenter?.fullName }}</td>
        </tr>
        <tr>
          <th>Specialty</th>
          <td>{{ data.specialty }}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>
            {{
              (specialistAddress = `${data.doctor?.address || data.diagnosticCenter?.address}, ${data.doctor?.city || data.diagnosticCenter?.city}, ${data.doctor?.state || data.diagnosticCenter?.state}`)
            }}
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specialistAddress)}`"
              target="_blank"
              class="bi bi-sign-turn-right"
              title="Open in Google Maps"
            ></a>
          </td>
        </tr>
        <tr>
          <th>Date / Time</th>
          <td>{{ data.date }} / {{ data.time }}</td>
        </tr>
        <tr v-if="data.appointmentRequestStatus === 'APPROVED'">
          <th>Appointment Status</th>
          <td>{{ data.appointmentStatus }}</td>
        </tr>
        <tr v-else>
          <th>Appointment Request Status</th>
          <td>{{ data.appointmentRequestStatus }}</td>
        </tr>
        <tr>
          <th>Cause of appointment</th>
          <td>{{ data.appointmentCause }}</td>
        </tr>
        <tr v-if="data.appointmentRequestStatus === 'REJECTED'">
          <th>Cause of rejection</th>
          <td>{{ data.rejectionCause }}</td>
        </tr>
        </tbody>
      </table>
      <div style="margin-top: 5px">
        <button class="btn btn-secondary" @click="goBack">Back</button>
        <button style="float: right; margin-left: 5px" class="btn btn-danger" @click="destroy" v-if="data.appointmentStatus !== 'CANCELLED' && untilOneHourBefore(data.date, data.time)">
          Cancel appointment
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.table-container {
  margin-top: 60px;
  padding: 20px;
}

.appointment-table th {
  font-weight: bold;
}

.appointment-table th,
.appointment-table td {
  border: 1px solid black;
  border-collapse: collapse;
  white-space: nowrap;
  padding: 25px 30px;
  text-align: center;
}

.appointment-table {
  width: 100%;
  border-collapse: collapse;
}
</style>
