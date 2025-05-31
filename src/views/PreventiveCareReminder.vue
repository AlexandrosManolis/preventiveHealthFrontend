<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRemoteData } from '@/composables/useRemoteData.js'

const route = useRoute()
const userIdRef = ref(route.params.id)

const backendEnvVar = import.meta.env.VITE_BACKEND

const urlRef = ref(`${backendEnvVar}/api/reminder/form/${userIdRef.value}/getForms`)
const authRef = ref(true)

const { data, performRequest, loading } = useRemoteData(urlRef, authRef)

onMounted(() => {
  performRequest()
})

// Get days until next appointment
const getDaysUntil = (dateString) => {
  if (!dateString) return { days: 'N/A', status: 'normal' }

  const nextDate = new Date(dateString)
  const today = new Date()
  const timeDiff = nextDate.getTime() - today.getTime()
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24))

  let status = 'normal'
  if(days <= 0){
    status = 'overdue'
  } else if (days <= 30){
    status = 'warning'
  }

  return { days, status }
}

const hasData = computed(() => data.value && (data.value.reminderForms?.length > 0 || data.value.appointments?.length > 0))

const reminderType = ref('preventiveCareReminder');
</script>

<template>
  <div class="reminder-container">
    <!-- Header section -->
    <div class="header" style="margin-top: 60px">
      <h3>Preventive Care Reminder</h3>
      <RouterLink :to="{ name: 'reminderForm', params: { id: userIdRef } }" class="btn-add">
        <i class="bi bi-pencil-square"></i>
        {{ hasData ? 'Add/Edit Reminders' : 'Add New Reminders' }}
      </RouterLink>
      <div>
        <select id="reminder" class="dropdown-toggle btn btn-add" v-model="reminderType">
          <option value="preventiveCareReminder">Preventive Care Reminder</option>
          <option value="appointmentReminder">Appointment Reminder</option>
        </select>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="spinner" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>

    <div v-if="!data || !hasData" class="no-data">
      <p>No reminder forms found. Please add new reminders.</p>
    </div>


    <div v-else class="cards-grid">
      <div v-for="(reminder, index) in data.reminderForms" :key="`reminder-${index}`" class="card" v-if="reminderType === 'preventiveCareReminder'">
        <div class="card-header">
          <span>{{ reminder.specialty }}</span>
          <span class="badge" :class="getDaysUntil(reminder.nextExamDateReminder).status">
            {{ getDaysUntil(reminder.nextExamDateReminder).days <= 0 ? 'Overdue' : `${getDaysUntil(reminder.nextExamDateReminder).days} days left` }}
          </span>
        </div>

        <div class="card-body">
          <div class="detail"><strong>Exam:</strong> {{ reminder.lastExam }}</div>
          <div class="detail"><strong>Last Visit:</strong> {{ reminder.lastExamDate }}</div>
          <div class="detail"><strong>Next Check-up:</strong> {{ reminder.nextExamDateReminder }}</div>
        </div>

        <RouterLink class="btn-primary" :to="{name: 'findSpecialist', query: {specialty: reminder.specialty}}">Make an appointment</RouterLink>
      </div>

      <!-- Appointment cards -->
      <div v-for="(appointment, index) in data.appointments" :key="`appt-${index}`" class="card" v-if="reminderType === 'appointmentReminder'">
        <div class="card-header"  v-if="appointment.appointmentStatus !== 'COMPLETED'">
          <span class="title">{{ appointment.specialty }}</span>
          <span class="badge" :class="getDaysUntil(appointment.date).status">
            {{ getDaysUntil(appointment.date).days <= 0 ? 'Overdue' : `${getDaysUntil(appointment.date).days} days left for your appointment` }}
          </span>
        </div>
        <div class="card-header" v-if="appointment.appointmentStatus === 'COMPLETED' && appointment.recheckDate">
          <span class="title">{{ appointment.specialty }}, {{appointment.appointmentStatus}}</span>
          <span class="badge" :class="getDaysUntil(appointment.recheckDate).status">
            {{ getDaysUntil(appointment.recheckDate).days <= 0 ? 'Overdue' : `${getDaysUntil(appointment.recheckDate).days} days left to make your next appointment` }}
          </span>
        </div>

        <div class="card-body">
          <div class="detail"><strong>Exam:</strong> {{ appointment.appointmentCause }}</div>
          <div class="detail"><strong>Appointment:</strong> {{ appointment.recheckDate ? appointment.recheckDate : appointment.date }}, {{ appointment.time }}</div>
        </div>

        <RouterLink :to="{name:'appointmentDetails', params: {id: appointment.patient.id, appointmentId: appointment.id}}" class="btn-secondary">
          Appointment details
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reminder-container {
  width: 100vh;
  margin: 2rem auto;
  padding: 0 1rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: nowrap;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 0.25rem solid rgba(59, 130, 246, 0.3);
  border-top-color: rgb(59, 130, 246);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-data {
  background-color: #f0f9ff;
  border-radius: 0.5rem;
  padding: 2rem;
  text-align: center;
  margin-bottom: 1rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.card {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  background-color: #f8fafc;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.overdue {
  background-color: #ef4444;
  color: white;
}

.badge.warning {
  background-color: #f59e0b;
  color: white;
}

.badge.normal {
  background-color: #10b981;
  color: white;
}

.card-body {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail {
  display: flex;
  flex-direction: row;
  gap: 10px;
  color: #475569;
}

.btn-primary, .btn-secondary, .btn-add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
  text-decoration: none;
  margin: 0.75rem;
}

.btn-primary {
  color: white;
  border: none;
}

.btn-secondary {
  background-color: #e2e8f0;
  color: #334155;
  border: none;
}

.btn-secondary:hover {
  background-color: #cbd5e1;
}

.btn-add {
  background-color: #f1f5f9;
  color: #334155;
  display: inline-flex;
  gap: 0.5rem;
}

.btn-add:hover {
  background-color: #e2e8f0;
}

@media (max-width: 720px) {
  .reminder-container {
    width: 100%;
    max-width: 1200px;
  }
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
