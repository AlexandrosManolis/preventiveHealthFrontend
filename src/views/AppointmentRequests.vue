<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Swal from 'sweetalert2';

const backendEnvVar = import.meta.env.VITE_BACKEND

const route = useRoute();
const router = useRouter();
const userIdRef = ref(route.params.id);

const urlRef= ref(`${backendEnvVar}/api/appointment/${userIdRef.value}/pendingAppointments`);
const authRef = ref(true);
const methodRef= ref("GET");

const {performRequest, data}= useRemoteData(urlRef, authRef, methodRef)

onMounted(()=>{
  performRequest();
});

const showAlert = (appointmentId) => {
  Swal.fire({
    title: "Cause of rejection",
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
        title: "Appointment rejected successfully",
        icon: "success"
      });
    }
  }).then(() => {
    window.location.reload();
  });
};
const onClick = async (appointmentId) => {
  try {
    urlRef.value = `${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentId}/accept`;
    methodRef.value = "POST";

    const { performRequest } = useRemoteData(urlRef, authRef, methodRef);
    const response = await performRequest();

    if (response.message) {
      Swal.fire({
        title: "Appointment accepted successfully",
        icon: "success"
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        title: "Request failed",
        icon: "error"
      });
    }
  } catch (error) {
    Swal.fire({
      title: "An error occurred",
      icon: "error",
      text: error.message || "Something went wrong!"
    });
  }
};

const goBack = ()=> router.push('/');
</script>

<template>
  <div v-if="data && data.length" class="appointment-table">
    <h1 style="text-align: center">Pending Appointments</h1>
    <table>
      <thead>
        <tr>
          <th>Id</th>
          <th>Patient's Name</th>
          <th>AMKA</th>
          <th>Date</th>
          <th>Time</th>
          <th>Request Status</th>
          <th>Cause Of Medical Appointment</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(data,index) in data" :key="index">
          <td data-label="Id">{{data.id}}</td>
          <td data-label="Patient's Name">{{data.patient.fullName}}</td>
          <td data-label="AMKA">{{data.patient.amka}}</td>
          <td data-label="Date">{{data.date}}</td>
          <td data-label="Time">{{data.time}}</td>
          <td data-label="Request Status">{{data.appointmentRequestStatus}}</td>
          <td data-label="Cause Of Medical Appointment">{{data.appointmentCause}}</td>
          <td data-label="Actions">
            <button class="btn btn-primary" @click="onClick(data.id)">Accept</button>
            <button class="btn btn-danger" @click="showAlert(data.id)">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
    <button class="btn btn-secondary" @click="goBack">Back</button>
  </div>

  <div v-else>
    <h1 style="text-align: center;">No Pending Requests Found.</h1>
    <button class="btn btn-secondary" @click="goBack">Back</button>
  </div>
</template>

<style scoped>
.appointment-table{
    width: 100%;
    padding: 0.875rem 1.125rem;
    margin-top: 60px;
}

.appointment-table th, .appointment-table td {
  white-space: nowrap;
  padding: 25px 30px;
  text-align: center;
}

.appointment-table th {
  text-align: center;
  font-weight: bold;
}

.btn{
  margin-right: 10px;
}

@media (max-width: 768px) {
  .appointment-table {
    display: block;
    width: 100%;
  }

  .appointment-table thead {
    display: none; /* Hide table headers */
  }

  .appointment-table tbody {
    display: block;
    width: 100%;
  }

  .appointment-table tr {
    display: block;
    border-radius: 10px;
    margin-bottom: 15px;
    padding: 10px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    width: 100%;
  }

  .appointment-table td {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    font-size: 16px;
    border-bottom: 1px solid #ddd;
  }

  .appointment-table td:last-child {
    border-bottom: none;
  }

  .appointment-table td::before {
    content: attr(data-label);
    margin-right: 15px;
    font-weight: bold;
  }
}
</style>
