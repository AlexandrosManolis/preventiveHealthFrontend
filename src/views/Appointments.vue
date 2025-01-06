<script setup>
import { onMounted, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'

const backendEnvVar = import.meta.env.VITE_BACKEND

const route = useRoute()
const userIdRef = ref(route.params.id)

const urlRef = ref(`${backendEnvVar}/api/appointment/${userIdRef.value}/appointments`)
const authRef = ref(true)

const { performRequest, data } = useRemoteData(urlRef, authRef)

onMounted(() => {
  performRequest();
})

const destroy = (appointmentId) => {
  const confirmed = window.confirm("Are you sure you want to cancel this appointment?");
  if (confirmed) {
    urlRef.value= `${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentId}/cancel`;
    const methodRef = ref('POST');
    const {performRequest} = useRemoteData(urlRef,authRef,methodRef)
    try{
      performRequest();
      window.location.reload();
      alert("Appointment canceled successfully!");
    }catch(err) {
      alert("Error occurred"+ err);
    }
  }
};
</script>

<template>
  <div class="table-container">
    <div v-if="data && data.length">
      <h1 style="text-align: center">Appointments</h1>
      <table class="appointment-table">
        <thead>
        <tr>
          <th>Id</th>
          <th>Date</th>
          <th>Time</th>
          <th>Specialty</th>
          <th>Request Status / Appointment Status</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(data, index) in data" :key="index">
          <td>{{ data.id }}</td>
          <td>{{ data.date }}</td>
          <td>{{ data.time }}</td>
          <td>{{ data.specialty }}</td>
          <td>
            <button class="btn btn-secondary" disabled>{{ data.appointmentRequestStatus }}</button>
            <span style="margin: 0 5px;">/</span>
            <button class="btn btn-secondary" disabled>{{ data.appointmentStatus }}</button>
          </td>
          <td>
            <RouterLink :to="{name:'appointmentDetails', params: {id: userIdRef, appointmentId: data.id}}" class="btn btn-primary">View Details</RouterLink>
            <button class="btn btn-danger" @click="destroy(data.id)">Cancel</button>
          </td>

        </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <h1 style="text-align: center">No appointments found</h1>
    </div>
  </div>
</template>

<style scoped>
.table-container {
  margin-top: 60px;
  padding: 20px;
}

.appointment-table {
  width: 100%;
  border-collapse: collapse;
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

.btn {
  margin-top: 5px;
  border: none;
  padding: 8px 12px;
  margin-right: 5px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}
</style>
