<script setup>
import { computed, onMounted, ref } from 'vue'
import {useRouter} from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'
import { useRemoteData } from '@/composables/useRemoteData.js'

const applicationStore = useApplicationStore();
const backendEnvVar = import.meta.env.VITE_BACKEND

const selectedValue = ref('')
const dropdownVisible = ref(false)

const router = useRouter();

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : [],
)
const username = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.username : null,
)

const urlRef = ref(`${backendEnvVar}/api/user/specialties`);
const authRef= ref(false);
const methodRef = ref('GET');

const { performRequest, data, error } = useRemoteData(urlRef, authRef, methodRef)

onMounted(()=>{
  performRequest();
});

const filteredOptions = computed(() => {
  const filter = selectedValue.value.toUpperCase()
  return data.value.filter((data) => data.toUpperCase().includes(filter))
})

const toggleDropdown = () => {
  dropdownVisible.value = !dropdownVisible.value
}

const filterFunction = () => {
  if (!dropdownVisible.value) {
    dropdownVisible.value = true
  }
}

const selectOption = (option) => {
  selectedValue.value = option
  dropdownVisible.value = false
}

const searchSpecialty = () => {
  if (selectedValue.value) {
    alert(`Searching for: ${selectedValue.value}`)
  } else {
    alert('Please select or enter a specialty!')
  }
}
const goback = () => router.push('/');
</script>

<template>
  <!-- Content Container -->
  <div class="content-container" v-if="data">
    <!-- Search Input with Search and Back Buttons -->
    <h1 class="text-center">Find Your Doctor Now</h1>
    <div class="input-group">
      <input
        v-model="selectedValue"
        @click="toggleDropdown"
        type="text"
        placeholder="Search specialty"
        id="myInput"
        @keyup="filterFunction"
        class="search-input"
      />
      <button @click="searchSpecialty" class="search-button">🔍</button>
      <button @click="goback" class="back-button">Back</button>
    </div>

    <!-- Dropdown Menu -->
    <div class="dropdown" v-if="dropdownVisible && filteredOptions.length">
      <div v-for="option in filteredOptions" :key="option" class="dropdown-item" @click.prevent="selectOption(option)">
        {{ option }}
      </div>
    </div>

    <!-- Selected Specialty -->
    <div v-if="selectedValue" class="selected-text">
      You selected: <strong>{{ selectedValue }}</strong>
    </div>
  </div>
</template>



<style scoped>
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


@media(max-width: 768px) {
  .content-container{
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
