<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRemoteData } from '@/composables/useRemoteData.js'

const backendEnvVar = import.meta.env.VITE_BACKEND;
const route = useRoute();
const router = useRouter();

const formDataRef = ref({ specialty: '', city: '' });
const results = ref([]);
const dropdownVisible = ref({ specialty: false, city: false });
const submitTriggered = ref(false);
const activeField = ref(null);
const specialtiesList = ref([]);
const citiesList = ref([]);
const searchPerformed = ref(false);

const urlRef = ref(`${backendEnvVar}/api/user/find_specialist`);
const authRef = ref(false);
const methodRef = ref('GET');

const { performRequest, data } = useRemoteData(urlRef, authRef, methodRef);

onMounted(() => {
  // Initialize from URL parameters
  formDataRef.value.specialty = route.query.specialty || '';
  formDataRef.value.city = route.query.city || '';

  loadDropdownOptions();

  // Perform search if URL has parameters
  if (formDataRef.value.specialty || formDataRef.value.city) {
    fetchSpecialists(formDataRef.value.specialty, formDataRef.value.city);
    searchPerformed.value = true;
  }
});

const loadDropdownOptions = async () => {
  urlRef.value = `${backendEnvVar}/api/user/find_specialist`;
  await performRequest();

  if (data.value?.allSpecialties) {
    specialtiesList.value = data.value.allSpecialties;
    citiesList.value = data.value.allcities;
  }
};

const fetchSpecialists = async (specialty, city) => {
  // Always include parameters
  urlRef.value = `${backendEnvVar}/api/user/find_specialist?specialty=${specialty || 'all'}&city=${city || 'all'}`;
  await performRequest();

  // Simplified result processing
  results.value = Array.isArray(data.value) ? data.value :
    (data.value?.specialists && Array.isArray(data.value.specialists)) ?
      data.value.specialists : [];
};

// Watch input fields to show/hide dropdowns
watch(() => formDataRef.value.specialty, (newValue) => {
  if (newValue && !submitTriggered.value) {
    activeField.value = 'specialty';
    dropdownVisible.value = { specialty: true, city: false };
  }
});

watch(() => formDataRef.value.city, (newValue) => {
  if (newValue && !submitTriggered.value) {
    activeField.value = 'city';
    dropdownVisible.value = { specialty: false, city: true };
  }
});

// Handle form submission
watch(() => submitTriggered.value, async (newValue) => {
  if (newValue) {
    const specialty = formDataRef.value.specialty || 'all';
    const city = formDataRef.value.city || 'all';

    // Update URL parameters
    await router.push({
      name: 'findSpecialist',
      query: {
        specialty: specialty !== 'all' ? specialty : undefined,
        city: city !== 'all' ? city : undefined
      }
    });

    // Perform search
    await fetchSpecialists(specialty, city);

    searchPerformed.value = true;
    dropdownVisible.value = { specialty: false, city: false };
    submitTriggered.value = false;
  }
});

// Filtered options for dropdowns
const filteredSpecialties = computed(() => {
  if (!formDataRef.value.specialty) return specialtiesList.value;

  const filter = formDataRef.value.specialty.toUpperCase();
  return specialtiesList.value.filter(specialty =>
    specialty.toString().toUpperCase().includes(filter)
  );
});

const filteredCities = computed(() => {
  if (!formDataRef.value.city) return citiesList.value;

  const filter = formDataRef.value.city.toUpperCase();
  return citiesList.value.filter(city =>
    city.toString().toUpperCase().includes(filter)
  );
});

// Dropdown control functions
const toggleDropdown = (field) => {
  activeField.value = field;
  dropdownVisible.value = {
    specialty: field === 'specialty' ? !dropdownVisible.value.specialty : false,
    city: field === 'city' ? !dropdownVisible.value.city : false
  };
};

const filterFunction = (field) => {
  activeField.value = field;
  dropdownVisible.value = {
    specialty: field === 'specialty',
    city: field === 'city'
  };
};

const selectOption = (option, field) => {
  formDataRef.value[field] = option;
  dropdownVisible.value[field] = false;
};

const onsubmit = (event) => {
  event.preventDefault();

  // Simplify assigning default values
  formDataRef.value.specialty = formDataRef.value.specialty || 'all';
  formDataRef.value.city = formDataRef.value.city || 'all';

  submitTriggered.value = true;
};

const goback = () => router.push('/');

const navigateToFindSpecialist = async () => {
  // Reset all state
  formDataRef.value = { specialty: '', city: '' };
  results.value = [];
  dropdownVisible.value = { specialty: false, city: false };
  searchPerformed.value = false;
  activeField.value = null;

  await router.push({ name: 'findSpecialist' });
  loadDropdownOptions();
};
</script>

<template>
  <div class="content-container" v-if="data">
    <h1 class="title" @click="navigateToFindSpecialist">Find Your Doctor Now</h1>

    <div class="input-group">
      <input v-model="formDataRef.specialty" @click="toggleDropdown('specialty')" @keyup="filterFunction('specialty')" type="text" placeholder="Search specialty" class="search-input" />

      <input v-model="formDataRef.city" @click="toggleDropdown('city')" @keyup="filterFunction('city')" type="text" placeholder="Search city" class="search-input" />

      <button @click="onsubmit" class="btn btn-primary">🔍</button>
    </div>

    <!-- Specialty dropdown -->
    <div class="dropdown" v-if="dropdownVisible.specialty && filteredSpecialties.length">
      <div v-for="option in filteredSpecialties" :key="option" class="dropdown-item" @click="selectOption(option, 'specialty')">
        {{ option }}
      </div>
    </div>

    <!-- City dropdown -->
    <div class="dropdown" v-if="dropdownVisible.city && filteredCities.length">
      <div v-for="option in filteredCities" :key="option" class="dropdown-item" @click="selectOption(option, 'city')">
        {{ option }}
      </div>
    </div>

    <button @click="goback" class="btn btn-secondary back-btn">Back</button>

    <!-- Results section -->
    <div v-if="results.length" class="results-container">
      <h3 class="search-heading">Searching for: {{ route.query.specialty }}</h3>

      <table class="results-table">
        <thead>
        <tr>
          <th>Full Name</th>
          <th>Specialty</th>
          <th>Address</th>
          <th>Type</th>
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
            {{ result.doctor?.address || result.diagnosticCenter?.address || 'N/A' }},
            {{ result.doctor?.city || result.diagnosticCenter?.city || 'N/A' }},
            {{ result.doctor?.state || result.diagnosticCenter?.state || 'N/A' }}
          </td>
          <td>
            {{ result.roles.some(role => role.roleName === 'ROLE_DOCTOR') ? 'Doctor' :
            result.roles.some(role => role.roleName === 'ROLE_DIAGNOSTIC') ? 'Diagnostic Center' : 'N/A' }}
          </td>
          <td>
            <RouterLink :to="{name: 'specialistDetails', params: { id: result.id }, query: { specialty: route.query.specialty }}" class="details-btn">
              View Details
            </RouterLink>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-if="searchPerformed && results.length === 0" class="no-results">
      <p>No results found.</p>
    </div>
  </div>
</template>

<style scoped>
.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 800px;
  margin: 2rem auto;
  padding: 1.5rem;
  box-sizing: border-box;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.title {
  margin-bottom: 2rem;
  color: #1a365d;
  cursor: pointer;
  font-weight: 700;
  text-align: center;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  margin-bottom: 0.5rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background-color: #f8fafc;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.btn {
  padding: 0.75rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background-color: #64748b;
  color: white;
}

.btn-secondary:hover {
  background-color: #475569;
}

.back-btn {
  margin-top: 1rem;
  width: 100%;
  max-width: 200px;
}

.dropdown {
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 0.5rem;
  border: 1px solid #e2e8f0;
  background-color: transparent;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  color: #1e293b;
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #f1f5f9;
}

.results-container {
  width: 100%;
  margin-top: 2rem;
  border-radius: 0.75rem;
  background-color: transparent;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.search-heading {
  padding: 1rem;
  margin: 0;
  background-color: transparent;
  font-weight: 600;
  color: #334155;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.results-table th {
  background-color: #1e40af;
  color: white;
  text-align: left;
  padding: 1rem;
  font-weight: 600;
}

.results-table td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}

.results-table tr:hover {
  background-color: #f8fafc;
}

.details-btn {
  display: inline-block;
  padding: 0.5rem 0.75rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.details-btn:hover {
  background-color: #2563eb;
}

.no-results {
  width: 100%;
  padding: 2rem;
  text-align: center;
  color: #64748b;
  background-color: transparent;
  border-radius: 0.5rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .content-container {
    padding: 1rem;
  }

  .input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    width: 100%;
    font-size: 0.875rem;
  }

  .results-table th,
  .results-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }

  .back-btn {
    width: 100%;
    max-width: none;
  }
}
</style>
