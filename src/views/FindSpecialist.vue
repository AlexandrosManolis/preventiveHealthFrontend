<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'
import { useRemoteData } from '@/composables/useRemoteData.js'

const backendEnvVar = import.meta.env.VITE_BACKEND;

const route = useRoute();
const router = useRouter();

const formDataRef = ref({ 'specialty': '' });
const results = ref([]); // Store search results
const dropdownVisible = ref(false); // Track dropdown visibility
const submitTriggered = ref(false);

const urlRef = ref(`${backendEnvVar}/api/user/find_specialist`);
const authRef = ref(false);
const methodRef = ref('GET');
const searchPerformed = ref(false);

const { performRequest, data } = useRemoteData(urlRef, authRef, methodRef);

onMounted(() => {
  const initialSpecialty = route.query.specialty || '';
  formDataRef.value.specialty = initialSpecialty;
  fetchSpecialists(initialSpecialty);
  if (initialSpecialty) {
    submitTriggered.value = true;
  } else {
    performRequest();
  }
});

const fetchSpecialists = async (specialty) => {
  if (specialty) {
    urlRef.value = `${backendEnvVar}/api/user/find_specialist?specialty=${specialty}`;
    await performRequest();
    results.value = data.value;

    // Fetch available specialties for the dropdown
    await performRequest();
  }
};

watch(
  () => formDataRef.value.specialty,
  async (newSpecialty) => {
    if (newSpecialty && !submitTriggered.value) {
      dropdownVisible.value = true;

      // Fetch available specialties dynamically
      urlRef.value = `${backendEnvVar}/api/user/find_specialist`;
      await performRequest();
    }
  }
);

watch(
  () => submitTriggered.value,
  async (newSubmitTriggered) => {
    if (newSubmitTriggered) {
      const specialty = formDataRef.value.specialty || 'all';
      urlRef.value = `${backendEnvVar}/api/user/find_specialist?specialty=${specialty}`;
      await router.push({ name: 'findSpecialist', query: { specialty } });

      const fetchedData = await performRequest();
      if (fetchedData) {
        results.value = fetchedData;
      } else {
        console.error('Error fetching updated data:', error.value);
      }

      searchPerformed.value = true;
      formDataRef.value.specialty = '';
      dropdownVisible.value = false;
      submitTriggered.value = false;
    }
  }
);

// Filtered options for dropdown
const filteredOptions = computed(() => {
  const filter = formDataRef.value.specialty.toUpperCase();
  return data.value.filter((option) => {
    if (typeof option === 'string') {
      return option.toUpperCase().includes(filter);
    } else if (option && typeof option.name === 'string') {
      return option.name.toUpperCase().includes(filter);
    }
    return false;
  });
});

// Dropdown visibility and selection logic
const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value;
};

const filterFunction = () => {
  dropdownVisible.value = true;
};

const selectOption = (option) => {
  formDataRef.value.specialty = option;
  dropdownVisible.value = false; // Hide the dropdown after selection
};

const onsubmit = async (event) => {
  event.preventDefault();
  if (!formDataRef.value.specialty) {
    formDataRef.value.specialty = 'all';
  }
  submitTriggered.value = true;
};

const goback = () => router.push('/');

const navigateToFindSpecialist = async () => {

  formDataRef.value.specialty = '';
  results.value = [];
  dropdownVisible.value = false;
  searchPerformed.value = false;

  await router.push({ name: 'findSpecialist' });

  performRequest();
};
</script>

<template>
  <div class="content-container" v-if="data">
    <h1 class="text-center" @click="navigateToFindSpecialist">Find Your Doctor Now</h1>
    <div class="input-group">
      <input v-model="formDataRef.specialty" @click="toggleDropdown" @keyup="filterFunction" type="text" placeholder="Search specialty" id="myInput" class="search-input" />
      <button @click="onsubmit" class="search-button">🔍</button>
      <button @click="goback" class="back-button">Back</button>
    </div>

    <div class="dropdown" v-if="dropdownVisible && filteredOptions.length">
      <div v-for="option in filteredOptions" :key="option" class="dropdown-item" @click.prevent="selectOption(option)">
        {{ option }}
      </div>
    </div>

    <div v-if="results.length" class="user-table-container">
      <h3>Searching for: {{route.query.specialty}}</h3>
      <table class="modern-table">
        <thead>
        <tr>
          <th>Full Name</th>
          <th>Specialty</th>
          <th>Address</th>
          <th>Details</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="result in results" :key="result.id">
          <td>{{ result.fullName }}</td>
          <td>
            <template v-if="result.roles.some(role => role.roleName === 'ROLE_DOCTOR')">
              {{ result.doctor?.specialty || 'N/A' }}
            </template>
            <template v-else-if="result.roles.some(role => role.roleName === 'ROLE_DIAGNOSTIC')">
              <div v-for="(specialty, index) in result.diagnosticCenter?.specialties || []" :key="index">
                {{ specialty }}
              </div>
            </template>
            <template v-else>N/A</template>
          </td>
          <td>
            {{ result.doctor?.address || result.diagnosticCenter?.address || 'N/A' }}
          </td>
          <td>
            <RouterLink :to="{name:'specialistDetails', params: {id:result.id}}" class="details-button bi bi-info-circle"> View Details</RouterLink>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div v-if="searchPerformed && results.length === 0">
      <p>No results found.</p>
    </div>
  </div>
</template>


<style scoped>
.user-table-container {
  margin: 20px;
  overflow-x: auto;
  border-radius: 8px;
  background-color: #f9f9f9;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 80vh;
  width: 100%;
  max-width: 600px;
  box-sizing: border-box;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

.modern-table th {
  background-color: #007bff;
  color: white;
  text-align: left;
  padding: 10px;
}

.modern-table td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.modern-table tr:hover {
  background-color: #f1f1f1;
}

.details-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.details-button:hover {
  background-color: #0056b3;
}


/* Content Container Styling */
.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80vh;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  margin-top: 20%;
  box-sizing: border-box;
}

/* Input Group Styling */
.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.search-input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;
}

.search-button,
.back-button {
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.search-button {
  background-color: #007bff;
}

.search-button:hover {
  background-color: #0056b3;
}

.back-button {
  background-color: #6c757d;
}

.back-button:hover {
  background-color: #5a6268;
}

/* Dropdown Styling */
.dropdown {
  width: 100%;
  margin-top: 10px;
  border: 1px solid #ddd;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
}

.dropdown-item:hover {
  background-color: #f1f1f1;
}

/* Selected Text Styling */
.selected-text {
  margin-top: 20px;
  font-size: 16px;
  color: #333;
}


@media (max-width: 768px) {
  .user-table-container{
    min-width: auto;
  }

  .content-container {
    min-width: auto;
  }

  .search-input {
    width: 100%;
    font-size: 14px;
  }

  .search-button {
    width: 100%;
    font-size: 14px;
  }

  .input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
}
</style>
