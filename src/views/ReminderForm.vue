<script setup>
import { onMounted, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Multiselect from 'vue-multiselect'
import "vue-multiselect/dist/vue-multiselect.min.css";
import "v-calendar/style.css";
import { useRoute } from 'vue-router'

const route = useRoute()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id);

const urlRef = ref(`${backendEnvVar}/api/user/specialties`)
const authRef = ref(true)
const availableSpecialties = ref([])
const requiredSpecialties = ref([])
const { performRequest } = useRemoteData(urlRef, authRef)

// Array of form data for all specialties
const formDataRef = ref([])

// States for UI controls
const isRequired = ref([])
const showHealthProblems = ref([])
const selectedHealthProblems = ref([])
const isRegularHealthCheck = ref([])
const isDropdownOpen = ref([])
const activeFormIndex = ref(0)
const specialties = ref([])

onMounted(async () => {
  specialties.value = await performRequest()
  availableSpecialties.value = specialties.value.filter(item => item.recommendCheckUp !== 'REQUIRED').map(item => item.name)
  requiredSpecialties.value = specialties.value.filter(item => item.recommendCheckUp === 'REQUIRED').map(item => item.name)
  // Initialize required specialties
  requiredSpecialties.value.forEach(specialty => {
    formDataRef.value.push({
      specialty,
      lastExamDate: null,
      lastExam: '',
      recurringTimeIntervalInDays: null
    })

    isRequired.value.push(true)
    showHealthProblems.value.push(false)
    selectedHealthProblems.value.push([])
    isRegularHealthCheck.value.push(false)
    isDropdownOpen.value.push(false)
  })
})

const getRemainingSpecialties = () => {
  const selected = formDataRef.value.map(form => form.specialty)
  return availableSpecialties.value.filter(specialty => !selected.includes(specialty))
}

const addSpecialty = () => {
  const newIndex = formDataRef.value.length
  formDataRef.value.push({
    specialty: '',
    lastExamDate: null,
    lastExam: '',
    recurringTimeIntervalInDays: null
  })

  isRequired.value.push(false)
  showHealthProblems.value.push(false)
  selectedHealthProblems.value.push([])
  isRegularHealthCheck.value.push(false)
  isDropdownOpen.value.push(false)
  activeFormIndex.value = newIndex
}

const removeSpecialty = (index) => {
  if (!isRequired.value[index]) {
    formDataRef.value.splice(index, 1)
    isRequired.value.splice(index, 1)
    showHealthProblems.value.splice(index, 1)
    selectedHealthProblems.value.splice(index, 1)
    isRegularHealthCheck.value.splice(index, 1)
    isDropdownOpen.value.splice(index, 1)

    // Adjust active form index if needed
    if (activeFormIndex.value >= formDataRef.value.length) {
      activeFormIndex.value = Math.max(0, formDataRef.value.length - 1)
    }
  }
}

const setActiveForm = (index) => {
  activeFormIndex.value = index
}

const toggleHealthProblems = (index) => {
  showHealthProblems.value[index] = !showHealthProblems.value[index];

  if (showHealthProblems.value[index]) {
    isRegularHealthCheck.value[index] = false;

    if (!Array.isArray(selectedHealthProblems.value[index])) {
      selectedHealthProblems.value[index] = [];
    }

    if (selectedHealthProblems.value[index].length === 0) {
      selectedHealthProblems.value[index].push({ lastExam: '', recurringTimeIntervalInDays: null });
    }
  }
};

const toggleRegularHealthCheck = (index) => {
  isRegularHealthCheck.value[index] = !isRegularHealthCheck.value[index]

  if (isRegularHealthCheck.value[index]) {
    showHealthProblems.value[index] = false
    selectedHealthProblems.value[index] = []
  }
}

const toggleDropdown = (index) => {
  // Close any open dropdowns
  isDropdownOpen.value = isDropdownOpen.value.map((_, i) => i === index ? !isDropdownOpen.value[i] : false)
}

const handleDateClick = (day, index, event) => {
  const clickedDate = day.date;

  if (!clickedDate || !(clickedDate instanceof Date)) {
    console.error("Invalid date:", day);
    return;
  }

  // Format the date as YYYY-MM-DD
  const year = clickedDate.getFullYear();
  const month = String(clickedDate.getMonth() + 1).padStart(2, "0");
  const date = String(clickedDate.getDate()).padStart(2, "0");

  formDataRef.value[index].lastExamDate = `${year}-${month}-${date}`;

  if (event?.target) {
    event.target.blur();
  }

  setTimeout(() => {
    toggleDropdown(index);
  }, 10);
};

const submitForm = () => {
  const formData = formDataRef.value.reduce((acc, specialty, index) => {
    if (isRegularHealthCheck.value[index] && specialty.lastExamDate) {
      specialty.lastExam = 'Regular Health Check';
      acc[`specialty_${index}`] = specialty;
    } else if (showHealthProblems.value[index]) {
      // Fix for health problems processing
      // We need to use the current index's selectedHealthProblems
      const healthProblem = selectedHealthProblems.value[index];

      // Check if health problem data exists and is valid
      if (healthProblem && healthProblem.lastExam && healthProblem.recurringTimeIntervalInDays) {
        // Create a copy of the specialty to avoid mutation issues
        const specialtyData = { ...specialty };
        specialtyData.lastExam = healthProblem.lastExam;
        specialtyData.recurringTimeIntervalInDays = parseInt(healthProblem.recurringTimeIntervalInDays);
        acc[`specialty_${index}`] = specialtyData;
      } else {
        console.error(`Validation failed for ${specialty.specialty}: Health Problem data is incomplete.`);
      }
    } else {
      console.error(`Validation failed for ${specialty.specialty}: Either Regular Health Check or a Health Problem must be selected.`)
    }
    return acc;
  }, {}); // Start with an empty object

  const bodyRef = ref();
  bodyRef.value = formData;


  // Only submit if we have data for all specialties
  if (Object.keys(formData).length === formDataRef.value.length) {
    urlRef.value = `${backendEnvVar}/api/reminder/form/${userIdRef.value}/save`;
    const methodRef = ref("POST");

    const { performRequest } = useRemoteData(urlRef, authRef, methodRef, bodyRef);
    performRequest();
  } else {
    console.error('Form submission failed due to missing required fields.');
  }
};
</script>

<template>
  <div class="container-fluid py-4 preventive-care-form" style="width: 100vh; margin-top: 60px; text-align: center">
    <h1>Welcome to our Preventive Care Reminder.</h1>
    <p>Please complete this form to get started.</p>
  </div>

  <div class="specialty-tabs">
    <button v-for="(form, idx) in formDataRef" :key="idx" v-if="formDataRef.length" @click="setActiveForm(idx)" :class="['specialty-tab', activeFormIndex === idx ? 'active' : '', isRequired[idx] ? 'required' : '']">
      {{ form.specialty || `Specialty #${idx + 1}` }}
      <span v-if="isRequired[idx]" class="required-badge">Required</span>
      <button v-if="!isRequired[idx]" class="remove-btn" @click.stop="removeSpecialty(idx)">×</button>
    </button>
    <button @click="addSpecialty" class="add-specialty-tab">+ Add Specialty</button>
  </div>

  <form @submit.prevent="submitForm" v-if="formDataRef.length">
    <div class="specialty-form-container">
      <!-- Current active specialty form -->
      <div class="specialty-form" v-if="activeFormIndex < formDataRef.length">
        <div class="specialty-header">
          <h4>
            <i class="bi bi-hospital me-2"></i>
            {{ formDataRef[activeFormIndex].specialty || `Specialty #${activeFormIndex + 1}` }}
            <span v-if="isRequired[activeFormIndex]" class="badge bg-primary ms-2">Required</span>
          </h4>
        </div>

        <div class="row g-3">
          <!-- Specialty Selection (only for non-required specialties) -->
          <div class="row g-3" v-if="!isRequired[activeFormIndex]">
            <div class="col-md-6">
              <label class="form-label">Medical Specialty</label>
            </div>
            <div class="col-md-6">
              <multiselect v-model="formDataRef[activeFormIndex].specialty" :options="getRemainingSpecialties()"
                :searchable="false" placeholder="Select your specialty">
              </multiselect>
            </div>
          </div>

          <!-- Last Visit Date -->
          <div class="row" style="margin-top: 10px">
            <div class="col-md-12">
              <label class="form-label" for="recommendedExam" style="padding-right: 5px"><b>Recommended exam:</b></label>
              <span>
                {{ specialties.find(s => s.name === formDataRef[activeFormIndex].specialty)?.medicalExam || '' }}
              </span>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="lastVisitDate"><b>Last Visit Date:</b></label>
            </div>
            <div class="col-md-6">
              <div class="input-group">
                <input :value="formDataRef[activeFormIndex].lastExamDate" class="form-control" placeholder="Select date" readonly @click="toggleDropdown(activeFormIndex)" />
                <VCalendar :model-value="formDataRef[activeFormIndex].lastExamDate" @dayclick="(day, event) => handleDateClick(day, activeFormIndex, event)" :max-date="new Date()" v-if="isDropdownOpen[activeFormIndex]" />
              </div>
            </div>
          </div>

          <!-- Toggle buttons for Regular Health Check and Health Problems -->
          <div class="col-12 mt-3">
            <button type="button" @click="toggleRegularHealthCheck(activeFormIndex)" :class="{ 'selected': isRegularHealthCheck[activeFormIndex] }"
                    v-if="!showHealthProblems[activeFormIndex]" class="btn btn-outline-secondary btn-sm custom-toggle-button mt-2" style="margin-right: 10px">
              <i class="bi" :class="isRegularHealthCheck[activeFormIndex] ? 'bi-check' : 'bi-plus-circle'"></i>
              {{ isRegularHealthCheck[activeFormIndex] ? 'Remove' : 'Add' }} Regular health check
            </button>

            <button type="button" class="btn btn-outline-secondary btn-sm" style="margin-top: 10px" @click="toggleHealthProblems(activeFormIndex)" v-if="!isRegularHealthCheck[activeFormIndex]">
              <i class="bi" :class="showHealthProblems[activeFormIndex] ? 'bi-dash-circle' : 'bi-plus-circle'"></i>
              {{ showHealthProblems[activeFormIndex] ? 'Hide Chronic Health Problems' : 'Add Chronic Health Problems' }}
            </button>
          </div>

          <!-- Health Problems Section -->
          <div v-if="showHealthProblems[activeFormIndex] && !isRegularHealthCheck[activeFormIndex]" class="col-12 p-3 mt-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Health Problem</label>
              </div>

              <input type="text" class="form-control" v-model="selectedHealthProblems[activeFormIndex].lastExam" placeholder="Enter chronic condition" />

              <label class="form-label mt-2">Recurring Check-up Interval</label>
              <select class="form-select" v-model="selectedHealthProblems[activeFormIndex].recurringTimeIntervalInDays">
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

    <div class="text-center mt-4">
      <button type="submit" class="btn btn-primary">
        <i class="bi bi-save me-2"></i> Save All Specialties
      </button>
    </div>
  </form>
</template>

<style scoped>
.specialty-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
  padding: 0 16px;
}

.specialty-tab {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  position: relative;
}

.specialty-tab.active {
  border-color: #0d6efd;
  background-color: #e6f7ff;
  font-weight: 500;
}

.specialty-tab.required {
  border-left: 3px solid #0d6efd;
}

.required-badge {
  font-size: 0.7em;
  background-color: #0d6efd;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-weight: bold;
  margin-left: 8px;
  padding: 0 4px;
  cursor: pointer;
}

.add-specialty-tab {
  padding: 8px 16px;
  border: 1px dashed #0d6efd;
  border-radius: 4px;
  background-color: white;
  color: #0d6efd;
  cursor: pointer;
}

.specialty-form-container {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.specialty-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
}

.custom-toggle-button.selected {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

@media (max-width: 768px) {
  .specialty-form-container {
    padding: 0.75rem;
    width: 100%;
    margin: 0 0 12px 0;
  }

  .specialty-header h4 {
    font-size: 1rem;
  }

  .specialty-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
    padding-bottom: 8px;
  }

  .specialty-tab, .add-specialty-tab {
    flex: 0 0 auto;
    white-space: nowrap;
  }
}

@media (max-width: 576px) {
  .specialty-form-container {
    border-radius: 6px;
    padding: 0.5rem;
  }

  .container-fluid.preventive-care-form {
    width: 100% !important;
    margin-top: 30px !important;
  }
}
</style>
