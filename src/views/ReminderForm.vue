<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Multiselect from 'vue-multiselect'
import "vue-multiselect/dist/vue-multiselect.min.css"
import "v-calendar/style.css"
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userIdRef = ref(route.params.id)
const backend = import.meta.env.VITE_BACKEND

// Keep these unchanged as requested
const urlRef = ref(``)
const authRef = ref(true)
const methodRef = ref("")
const bodyRef = ref()

// Core data
const formDataRef = ref([])
const activeFormIndex = ref(0)
const specialties = ref([])
const isDropdownOpen = ref([])
const loadingForms = ref(true)
const existingForms = ref({ reminderForms: [] })

// Computed properties
const requiredSpecialties = computed(() =>
  specialties.value.filter(s => s.recommendCheckUp === 'REQUIRED').map(s => s.specialty)
)
const availableSpecialties = computed(() =>
  specialties.value.filter(s => s.recommendCheckUp !== 'REQUIRED').map(s => s.specialty)
)
const remainingSpecialties = computed(() =>
  availableSpecialties.value.filter(s => !formDataRef.value.map(f => f.specialty).includes(s))
)
const getRecommendedExam = s => specialties.value.find(x => x.specialty === s)?.medicalExam || ''

// Initialize on mount
onMounted(async () => {
  // Fetch specialties
  urlRef.value = `${backend}/api/user/specialties`
  specialties.value = await useRemoteData(urlRef, authRef).performRequest()

  // Fetch forms
  urlRef.value = `${backend}/api/reminder/form/${userIdRef.value}/getForms`
  const { data, performRequest } = useRemoteData(urlRef, authRef)
  await performRequest()
  existingForms.value = data.value
  loadingForms.value = false

  // Process existing forms
  const existing = new Map()
  existingForms.value.reminderForms?.forEach(form => {
    existing.set(form.specialty, true)
    const isHealthProblem = form.lastExam && form.lastExam !== 'Regular Health Check'
    formDataRef.value.push({
      specialty: form.specialty,
      lastExamDate: form.lastExamDate,
      lastExam: form.lastExam,
      recurringTimeIntervalInDays: form.recurringTimeIntervalInDays,
      isRequired: requiredSpecialties.value.includes(form.specialty),
      showHealthProblems: isHealthProblem,
      isRegularHealthCheck: !isHealthProblem,
      healthProblemData: isHealthProblem ? {
        lastExam: form.lastExam,
        recurringTimeIntervalInDays: form.recurringTimeIntervalInDays
      } : { lastExam: '', recurringTimeIntervalInDays: null }
    })
    isDropdownOpen.value.push(false)
  })

  // Add missing required specialties
  requiredSpecialties.value.forEach(s => {
    if (!existing.has(s)) {
      formDataRef.value.push({
        specialty: s, lastExamDate: null, lastExam: '', recurringTimeIntervalInDays: null,
        isRequired: true, showHealthProblems: false, isRegularHealthCheck: false,
        healthProblemData: { lastExam: '', recurringTimeIntervalInDays: null }
      })
      isDropdownOpen.value.push(false)
    }
  })
})

const setActiveForm = idx => {
  activeFormIndex.value = idx
}

const addSpecialty = () => {
  formDataRef.value.push({
    specialty: '', lastExamDate: null, lastExam: '', recurringTimeIntervalInDays: null,
    isRequired: false, showHealthProblems: false, isRegularHealthCheck: false,
    healthProblemData: { lastExam: '', recurringTimeIntervalInDays: null }
  })
  isDropdownOpen.value.push(false)
  activeFormIndex.value = formDataRef.value.length - 1
}

const removeSpecialty = idx => {
  if (!formDataRef.value[idx].isRequired) {
    formDataRef.value.splice(idx, 1)
    isDropdownOpen.value.splice(idx, 1)
    activeFormIndex.value = Math.min(activeFormIndex.value, formDataRef.value.length - 1)
  }
}

const toggleHealthProblems = idx => {
  const form = formDataRef.value[idx]
  form.showHealthProblems = !form.showHealthProblems
  if (form.showHealthProblems) {
    form.isRegularHealthCheck = false
    form.healthProblemData ??= { lastExam: '', recurringTimeIntervalInDays: null }
  }
}

const toggleRegularHealthCheck = idx => {
  const form = formDataRef.value[idx]
  form.isRegularHealthCheck = !form.isRegularHealthCheck
  if (form.isRegularHealthCheck) {
    form.showHealthProblems = false
    form.lastExam = 'Regular Health Check'
  }
}

const toggleDropdown = idx => {
  isDropdownOpen.value = isDropdownOpen.value.map((_, i) => i === idx)
}

const handleDateClick = (day, idx) => {
  if (!day.isDisabled && day.date instanceof Date) {
    formDataRef.value[idx].lastExamDate = day.date.toISOString().split('T')[0]
    setTimeout(() => toggleDropdown(idx), 10)
  }
}

const submitForm = () => {
  const formData = {}
  let valid = true

  formDataRef.value.forEach((form, idx) => {
    if (form.isRegularHealthCheck && form.lastExamDate) {
      formData[`specialty_${idx}`] = {
        specialty: form.specialty,
        lastExamDate: form.lastExamDate,
        lastExam: 'Regular Health Check',
        recurringTimeIntervalInDays: null
      }
    } else if (form.showHealthProblems && form.lastExamDate &&
      form.healthProblemData?.lastExam && form.healthProblemData?.recurringTimeIntervalInDays) {
      formData[`specialty_${idx}`] = {
        specialty: form.specialty,
        lastExamDate: form.lastExamDate,
        lastExam: form.healthProblemData.lastExam,
        recurringTimeIntervalInDays: parseInt(form.healthProblemData.recurringTimeIntervalInDays)
      }
    } else {
      valid = false
    }
  })

  if (valid) {
    urlRef.value = `${backend}/api/reminder/form/${userIdRef.value}/save`
    methodRef.value = "POST"
    bodyRef.value = formData
    useRemoteData(urlRef, authRef, methodRef, bodyRef).performRequest()
      .then(() => router.push(`/user/${userIdRef.value}/preventiveCareReminder`))
  }
}

const goBack = () => router.push(`/user/${userIdRef.value}/preventiveCareReminder`)
</script>

<template>
  <div class="preventive-care-container">
    <div class="header">
      <h1>Preventive Care Reminder</h1>
      <p v-if="loadingForms">Loading your reminders...</p>
      <p v-else>{{ existingForms.reminderForms?.length > 0 ? 'Edit your reminders below' : 'Please complete this form to get started.' }}</p>
    </div>

    <div v-if="loadingForms" class="loading">
      <div class="spinner"></div>
      <span>Loading...</span>
    </div>

    <div v-else class="content">
      <div class="specialty-tabs">
        <button v-for="(form, idx) in formDataRef" :key="idx" @click="setActiveForm(idx)" :class="['specialty-tab',activeFormIndex === idx ? 'active' : '', form.isRequired ? 'required' : '']">
          {{ form.specialty || `Specialty #${idx + 1}` }}
          <span v-if="form.isRequired" class="required-badge">Required</span>
          <button v-if="!form.isRequired" class="remove-btn" @click.stop="removeSpecialty(idx)">×</button>
        </button>
        <button @click="addSpecialty" class="add-specialty-btn">
           <span><i class="bi bi-plus-circle"></i> Add Specialty</span>
        </button>
      </div>

      <form @submit.prevent="submitForm" v-if="formDataRef.length">
        <div class="form-container">
          <div class="specialty-form" v-if="activeFormIndex < formDataRef.length">
            <div class="form-header">
              <h2>
                <i class="bi bi-hospital"></i>
                {{ formDataRef[activeFormIndex].specialty || `Specialty #${activeFormIndex + 1}` }}
                <span v-if="formDataRef[activeFormIndex].isRequired" class="required-label">Required</span>
              </h2>
            </div>

            <!-- Specialty Selection (only for non-required specialties) -->
            <div class="form-row" v-if="!formDataRef[activeFormIndex].isRequired">
              <div class="form-group">
                <label>Medical Specialty</label>
                <multiselect v-model="formDataRef[activeFormIndex].specialty" :options="remainingSpecialties" :searchable="false" placeholder="Select your specialty"></multiselect>
              </div>
            </div>

            <!-- Recommended Exam and Last Visit Date -->
            <div class="form-row">
              <div class="form-group">
                <label><b>Recommended exam:</b></label>
                <div class="recommended-exam">
                  {{ getRecommendedExam(formDataRef[activeFormIndex].specialty) }}
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label><b>Last Visit Date:</b></label>
                <div class="date-picker">
                  <input :value="formDataRef[activeFormIndex].lastExamDate" class="date-input" placeholder="Select date" readonly @click="toggleDropdown(activeFormIndex)" />
                  <VCalendar :model-value="formDataRef[activeFormIndex].lastExamDate" @dayclick="(day, event) => handleDateClick(day, activeFormIndex, event)"
                             :max-date="new Date()" v-if="isDropdownOpen[activeFormIndex]" />
                </div>
              </div>
            </div>

            <!-- Toggle buttons for checkup types -->
            <div class="form-row button-group">
              <button type="button" @click="toggleRegularHealthCheck(activeFormIndex)"
                :class="['toggle-btn', formDataRef[activeFormIndex].isRegularHealthCheck ? 'active' : '']">
                <i :class="formDataRef[activeFormIndex].isRegularHealthCheck ? 'bi-check-circle-fill' : 'bi-plus-circle'"></i>
                {{ formDataRef[activeFormIndex].isRegularHealthCheck ? 'Remove' : 'Add' }} Regular health check
              </button>

              <button type="button" @click="toggleHealthProblems(activeFormIndex)" :class="['toggle-btn',formDataRef[activeFormIndex].showHealthProblems ? 'active' : '']">
                <i :class="formDataRef[activeFormIndex].showHealthProblems ? 'bi-dash-circle' : 'bi-plus-circle'"></i>
                {{ formDataRef[activeFormIndex].showHealthProblems ? 'Hide' : 'Add' }} Chronic Health Problems
              </button>
            </div>

            <!-- Health Problems Section -->
            <div v-if="formDataRef[activeFormIndex].showHealthProblems" class="health-problems-section">
              <div class="form-group">
                <label>Health Problem</label>
                <input type="text" v-model="formDataRef[activeFormIndex].healthProblemData.lastExam" placeholder="Enter chronic condition" />
              </div>

              <div class="form-group">
                <label>Recurring Check-up Interval</label>
                <select v-model="formDataRef[activeFormIndex].healthProblemData.recurringTimeIntervalInDays">
                  <option value="">Select Interval</option>
                  <option value="30">Every month</option>
                  <option value="90">Every 3 months</option>
                  <option value="180">Every 6 months</option>
                  <option value="360">Every year</option>
                  <option value="720">Every 2 years</option>
                  <option value="1080">Every 3 years</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="goBack">
            <i class="bi bi-x-octagon"></i> Cancel
          </button>
          <button type="submit" class="save-btn">
            <i class="bi bi-save"></i> Save All Specialties
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.preventive-care-container {
  margin-top: 60px;
  padding: 2rem 1rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 0.5rem;
}

/* Loading */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Specialty Tabs */
.specialty-tabs {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  margin-bottom: 20px;
  padding: 0 16px;
  scrollbar-width: thin;
  width: 100vh;
}

.specialty-tab, .add-specialty-btn {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  font-weight: 500;
  transition: all 0.2s ease;
}

.specialty-tab {
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
}

.specialty-tab:hover { background-color: #e2e8f0; }
.specialty-tab.active {
  background-color: #dbeafe;
  border-color: #60a5fa;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.specialty-tab.required { border-left: 3px solid #2563eb; }

.required-badge {
  font-size: 0.65rem;
  background-color: #2563eb;
  color: white;
  padding: 0.15rem 0.5rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
}

.required-label {
  font-size: 0.75rem;
  background-color: #2563eb;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: 0.5rem;
  opacity: 0.7;
}
.remove-btn:hover { opacity: 1; }

.add-specialty-btn {
  background-color: #f0f9ff;
  border: 1px dashed #60a5fa;
  color: #2563eb;
  display: flex;
  align-items: center;
}
.add-specialty-btn:hover { background-color: #dbeafe; }

/* Form Container */
.form-container {
  background-color: #f8fafc;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  width: 100%;
}

.specialty-form { padding: 1.5rem; }

.form-header {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.form-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row { margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; }

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #334155;
}

/* Form Elements */
.recommended-exam {
  padding: 0.5rem;
  background-color: #f1f5f9;
  border-radius: 0.375rem;
  color: #334155;
}

.date-picker {
  position: relative;
  width: 100%;
}

.date-input, .health-problems-section input, .health-problems-section select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  background-color: white;
}
.date-input { cursor: pointer; }

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}
.toggle-btn:hover { background-color: #e2e8f0; }
.toggle-btn.active {
  background-color: #dbeafe;
  border-color: #60a5fa;
  color: #2563eb;
}

.health-problems-section {
  background-color: #f1f5f9;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-top: 1rem;
  border: 1px solid #cbd5e1;
  width: 100%;
}

/* Buttons */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn, .save-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background-color: #fee2e2;
  color: #b91c1c;
}
.cancel-btn:hover { background-color: #fecaca; }

.save-btn {
  background-color: #2563eb;
  color: white;
}
.save-btn:hover { background-color: #1d4ed8; }

@media (max-width: 768px) {
  .preventive-care-container {
    padding: 1.5rem 0.75rem;
    margin-top: 40px;
    width: 100%;
  }

  .specialty-tabs{
    width: 100%;
  }

  .header h1 {
    font-size: 1.75rem;
  }

  .button-group {
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .toggle-btn {
    width: 100%;
    justify-content: center;
  }

  .specialty-form {
    padding: 1rem;
  }

  .form-row {
    margin-bottom: 1rem;
  }
}
</style>
