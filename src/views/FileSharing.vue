<script setup>
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'
import PdfDownloadView from '@/views/PdfDownloadView.vue'
import PdfView from '@/views/PdfView.vue'
import { useApplicationStore } from '@/stores/application.js'
import Swal from 'sweetalert2'

const route = useRoute();
const router = useRouter();
const userIdRef = ref(route.params.id);
const applicationStore = useApplicationStore()

const userRole = computed(()=>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
)

const backendEnvVar = import.meta.env.VITE_BACKEND
const urlRef = ref(`${backendEnvVar}/api/medicalRecord/${userIdRef.value}/examFiles`)
const authRef = ref(true)

const { performRequest, data } = useRemoteData(urlRef, authRef);

// New state for tracking selected files - storing entire file objects instead of just IDs
const selectedFiles = ref([]);
const isSelectionMode = ref(false);

// Toggle selection mode
const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  // Clear selections when exiting selection mode
  if (!isSelectionMode.value) {
    selectedFiles.value = [];
  }
};

// Check if a file is selected
const isFileSelected = (file) => {
  return selectedFiles.value.some(selectedFile => selectedFile.id === file.id);
};

// Toggle file selection
const toggleFileSelection = (file) => {
  const index = selectedFiles.value.findIndex(selectedFile => selectedFile.id === file.id);
  if (index === -1) {
    // Add the entire file object to the selection
    selectedFiles.value.push(file);
  } else {
    // Remove the file from the selection
    selectedFiles.value.splice(index, 1);
  }
};

// Share selected files
const shareSelectedFiles = async () => {
  if (selectedFiles.value.length === 0) {
    Swal.fire({
      title: 'No Files Selected',
      text: 'Please select at least one file to share',
      icon: 'warning'
    });
    return;
  }

  try {
    // First, fetch the provider information for sharing
    const urlRef = ref(`${backendEnvVar}/api/medicalRecord/${userIdRef.value}/providers`);
    const authRef = ref(true);

    // Create a new instance for this specific request
    const { data, performRequest } = useRemoteData(urlRef, authRef);

    // Show loading state while fetching providers
    Swal.fire({
      title: 'Loading',
      text: 'Fetching healthcare providers...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    await performRequest();

    // Close loading dialog
    Swal.close();

    // Check if we have valid data from the API
    if (!data.value || data.value.length === 0) {
      Swal.fire({
        title: 'No Healthcare Providers Available',
        text: 'There are no healthcare providers available to share with.',
        icon: 'info'
      });
      return;
    }

    // Process the data structure we received
    const providerOptions = data.value.map(provider => {
      // Check if the provider is a diagnostic center or doctor
      const isClinic = Object.prototype.hasOwnProperty.call(provider, 'diagnosticCenter');

      return {
        id: provider.id,
        name: provider.fullName,
        type: isClinic ? 'diagnostic' : 'doctor',
      };
    });

    if (providerOptions.length === 0) {
      Swal.fire({
        title: 'No Healthcare Providers Available',
        text: 'There are no healthcare providers available to share with.',
        icon: 'info'
      });
      return;
    }

    const selectOptions = providerOptions.map(provider => {
      const providerType = provider.type === 'doctor' ? 'Doctor' : 'Diagnostic Center';
      return `<option value="${provider.id}">${provider.name} (${providerType})</option>`;
    }).join('');

    // Show dialog to select provider and confirm sharing
    const { value: selectedProviderValue, isConfirmed } = await Swal.fire({
      title: 'Share Medical Files',
      html: `
        <div style="text-align: left; margin-bottom: 15px;">
          <p>Please select a healthcare provider to share with:</p>
          <select id="provider-select" class="swal2-select" style="width: fit-content; padding: 8px; margin-bottom: 15px;">
            <option value="" disabled selected>Select a healthcare provider</option>
            ${selectOptions}
          </select>
          <p>You're sharing ${selectedFiles.value.length} file(s):</p>
          <ul style="padding-left: 20px; max-height: 150px; overflow-y: auto;">
            ${selectedFiles.value.map(file => `<li>${file.fileName} / ${file.id}</li>`).join('')}
          </ul>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Continue',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const selectedProvider = document.getElementById('provider-select').value;
        if (!selectedProvider) {
          Swal.showValidationMessage('Please select a healthcare provider');
          return false;
        }
        return selectedProvider;
      }
    });

    if (!isConfirmed || !selectedProviderValue) {
      return; // User cancelled or didn't select a provider
    }

    //const [recipientType, recipientId] = selectedProviderValue.split(':');

    const selectedProvider = providerOptions.find(p => p.id === parseInt(selectedProviderValue));
    const recipientName = selectedProvider ? selectedProvider.name : 'Selected Provider';
    console.log(recipientName)

    // Show loading state
    Swal.fire({
      title: 'Sharing Files',
      text: `Sharing with ${recipientName}. Please wait...`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    console.log(selectedProvider)
    urlRef.value = `${backendEnvVar}/api/medicalRecord/${userIdRef.value}/shareFile/${selectedProvider.id}`
    console.log(urlRef)
    const methodRef = ref("POST")
    const bodyRef = ref({
      exams: selectedFiles.value.map(file => ({
        medicalExamId: file.id,
        medicalExamName: file.fileName
      }))
    })
    const {performRequest : sharefile} = useRemoteData(urlRef,authRef,methodRef,bodyRef)

    await sharefile();

    Swal.fire({
      title: 'Files Shared',
      text: `Your medical files have been successfully shared with ${recipientName}.`,
      icon: 'success'
    });

  } catch (error) {
    console.error('Error sharing files:', error);
    Swal.fire({
      title: 'Error',
      text: 'There was a problem sharing your files. Please try again later.',
      icon: 'error'
    });
  }
};

const grouped = computed(() => {
  if (!data.value) return { filesByGroup: {}, groups: [] };

  const filesByGroup = {};

  data.value.forEach(file => {
    let groupKey;

    if (userRole.value.includes('ROLE_PATIENT')) {
      groupKey = file.specialty || 'Other';
    } else {
      groupKey = file.patientFullName || 'Unknown Patient';
    }

    if (!filesByGroup[groupKey]) {
      filesByGroup[groupKey] = [];
    }
    filesByGroup[groupKey].push(file);
  });

  const groups = Object.keys(filesByGroup).sort();

  return {
    filesByGroup,
    groups
  };
});

onMounted(() => {
  performRequest();
})

const showPdfView = ref(false);
const currentPdfFile = ref(null);

const viewPdf = (appointmentId) => {
  currentPdfFile.value = appointmentId;
  showPdfView.value = false; // reset
  nextTick(() => {
    showPdfView.value = true;
  });
};

const goBack = () => {
  return router.back(1);
};
</script>

<template>
  <div style="margin-top: 60px">
    <div v-if="data && data.length">
      <div style="display: flex; flex-direction: row; gap: 10px; align-items: center; margin-bottom: 20px;" v-if="userRole.includes('ROLE_PATIENT')">
        <h2 class="text-center" style="color: #2d3748; margin: 0;">Medical Exams</h2>
        <button v-if="!isSelectionMode && userRole.includes('ROLE_PATIENT')" @click="toggleSelectionMode" class="btn btn-secondary">Share files</button>
        <template v-else>
          <button @click="shareSelectedFiles" class="btn btn-primary" :disabled="selectedFiles.length === 0">
            Share {{ selectedFiles.length }} selected
          </button>
          <button @click="toggleSelectionMode" class="btn btn-outline-secondary">Cancel</button>
        </template>
      </div>

      <div v-for="group in grouped.groups" :key="group" class="specialty-section">
        <h3 class="specialty-title">{{ group }}</h3>

        <div class="exam-list">
          <div v-for="file in grouped.filesByGroup[group]" :key="file.id" class="exam-card" :class="{ 'selected': isFileSelected(file) }">
            <div class="exam-header">
              <div class="file-header">
                <div v-if="isSelectionMode && userRole.includes('ROLE_PATIENT')" class="file-checkbox">
                  <input type="checkbox" :checked="isFileSelected(file)" @change="toggleFileSelection(file)" :id="`file-${file.id}`">
                  <label :for="`file-${file.id}`"></label>
                </div>
                <h3 class="file-name">{{ file.fileName }}</h3>
              </div>
              <p class="appointment">Specialty: {{ file.specialty }}</p>
              <p class="appointment">Appointment Date: {{ file.date }}</p>
              <p class="appointment">Diagnosis: {{ file.diagnosis }}</p>

              <div class="actions">
                <button class="view-btn" @click="viewPdf(file.appointmentId)">
                  <span class="bi bi-eye"> View PDF</span>
                </button>
                <PdfDownloadView :id="file.id" class="download-btn" v-if="userRole.includes('ROLE_PATIENT')"/>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PdfView :appointment_id="currentPdfFile" v-if="showPdfView" @close="showPdfView = false"/>
    </div>

    <div v-else class="no-exams">
      <p>No medical exams found.</p>
      <div class="loading">
        <p>Loading medical exam files...</p>
      </div>
    </div>
    <button class="btn btn-secondary" @click="goBack" style="margin-top: 20px;">Back</button>
  </div>
</template>

<style scoped>
.specialty-section {
  margin-bottom: 2rem;
}

.specialty-title {
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #4a5568;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exam-card {
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: white;
  transition: all 0.2s ease;
  position: relative;
}

.exam-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.exam-card.selected {
  border: 2px solid #3182ce;
  background-color: #ebf8ff;
}

.file-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-checkbox {
  display: flex;
  align-items: center;
}

.file-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.exam-header {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.file-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1a202c;
}

.appointment {
  margin: 0.25rem 0;
  color: #4a5568;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.view-btn, .download-btn {
  background-color: #2b6cb0;
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.view-btn:hover, .download-btn:hover {
  background-color: #2c5282;
}

.no-exams, .loading {
  text-align: center;
  padding: 3rem 1rem;
  color: #4a5568;
  font-size: 1.1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background-color: #3182ce;
  color: white;
  border: none;
}

.btn-primary:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #718096;
  color: white;
  border: none;
}

.btn-outline-secondary {
  background-color: transparent;
  color: #718096;
  border: 1px solid #718096;
}
</style>
