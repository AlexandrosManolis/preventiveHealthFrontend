<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute();
const router = useRouter();
const userIdRef = ref(route.params.id);

const backendENvVar = import.meta.env.VITE_BACKEND
const urlRef = ref(`${backendENvVar}/api/user/${userIdRef.value}/examFiles`)
const authRef = ref(true)

const { performRequest, data } = useRemoteData(urlRef, authRef);

const grouped = computed(() => {
  if (!data.value) return { filesBySpecialty: {}, specialties: [] };

  const filesBySpecialty = {};

  data.value.forEach(file => {
    const specialty = file.specialty || 'Other';
    if (!filesBySpecialty[specialty]) {
      filesBySpecialty[specialty] = [];
    }
    filesBySpecialty[specialty].push(file);
  });

  const specialties = Object.keys(filesBySpecialty).sort();

  return {
    filesBySpecialty,
    specialties
  };
});

onMounted(() => {
  performRequest();
})
</script>

<template>
  <div style="margin-top: 60px">
    <div v-if="data">
      <h2 class="text-center" style="color: #2d3748;">Medical Exams</h2>

      <div v-for="specialty in grouped.specialties" :key="specialty" class="specialty-section">
        <h3 class="specialty-title">{{ specialty }}</h3>

        <div class="exam-list">
          <div v-for="file in grouped.filesBySpecialty[specialty]" :key="file.url" class="exam-card">
            <div class="exam-header">
              <h3 class="file-name">{{ file.fileName }}</h3>
              <p class="appointment">Specialty: {{ file.specialty }}</p>
              <p class="appointment">Appointment Date: {{ file.date }}</p>
              <p class="appointment">Diagnosis: {{ file.diagnosis }}</p>

              <div class="actions">
                <a :href="file.url" target="_blank" download class="download-btn">
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-exams">
      <p>No medical exams found.</p>
      <div class="loading">
        <p>Loading medical exam files...</p>
      </div>
    </div>
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
}

.exam-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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

.download-btn {
  background-color: #2b6cb0;
  color: white;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.download-btn:hover {
  background-color: #2c5282;
}

.no-exams, .loading {
  text-align: center;
  padding: 3rem 1rem;
  color: #4a5568;
  font-size: 1.1rem;
}
</style>
