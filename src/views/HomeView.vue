<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApplicationStore } from '@/stores/application.js'

const applicationStore = useApplicationStore();
const backendEnvVar = import.meta.env.VITE_BACKEND;
const userIdRef = ref(null);

const pendingUserRequest = ref(false);
const regectedUserRequest = ref(false);
const selectedValue=ref("");
const dropdownVisible= ref(false);

const options= ref(null);

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
);
const username = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.username : null
);

const filteredOptions= computed(() =>{
    const filter = selectedValue.value.toUpperCase();
    return this.options.filter((option) => option.toUpperCase().includes(filter))
});


const toggleDropdown=() =>{
  dropdownVisible.value = !dropdownVisible.value;
}

const filterFunction= ()=> {
  if (!dropdownVisible.value) {
    dropdownVisible.value = true;
  }
}

const selectOption = (option) => {
  selectedValue.value = option;
  dropdownVisible.value = false;
}

const searchSpecialty= () => {
  if (selectedValue.value) {
    alert(`Searching for: ${selectedValue.value}`);
  } else {
    alert("Please select or enter a specialty!");
  }
}

const checkRequestExistence = async (username, status) => {
  try {
    const response = await fetch(`${backendEnvVar}/api/register-request/${status}?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.exists; // Return both the status and existence
  } catch (error) {
    console.error(`Error checking ${status} request:`, error);
    return { status, exists: false }; // Default to `false` if an error occurs
  }
};

onMounted(async () => {
  pendingUserRequest.value = await checkRequestExistence(username.value, "pending");
  regectedUserRequest.value = await checkRequestExistence(username.value, "rejected");
});
</script>

<template>
  <div class="horizontal-container align-items-center" v-if="!userRole.includes('ROLE_DOCTOR' || 'ROLE_DIAGNOSTIC')">
    <img
      src="@/assets/preventivehealth.webp"
      alt="Preventive Health App Design"
      class="aligned-image" />

    <div class="aligned-text app-footer ">
      <!-- Search Input with Search Button -->
      <div class="input-group">
        <input v-model="selectedValue" @click="toggleDropdown" type="text"
          placeholder="Search specialty" id="myInput" @keyup="filterFunction" class="search-input" />
        <button @click="searchSpecialty" class="search-button">🔍</button>
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
  </div>
  <div class="header" v-if="(userRole.includes('ROLE_DOCTOR') || userRole.includes('ROLE_DIAGNOSTIC'))">
    <div v-if="pendingUserRequest">
      <h1 class="header">Your request is still in Pending status! Please come back later.</h1>
    </div>
    <div v-if="regectedUserRequest">
      <h1 class="header">Your request rejected! Please contact us or check your email.</h1>
    </div>
  </div>

</template>


<style scoped>
.header h1{
  justify-content: center;
  text-align: center;
  margin-top: 50%;
}
/* General Styles */
.horizontal-container {
  max-width: 600px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 20px;
}

/* Image Styling */
.aligned-image {
  max-width: 400px;
  height: auto;
  border-radius: 10px;
}

/* Footer Styling */
.app-footer {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* Input and Button Styling */
.input-group {
  display: flex;
  align-items: center;
  gap: 10px; /* Add space between input and button */
  flex-wrap: nowrap; /* Prevent wrapping of input and button */
}


.search-input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 5px;
  outline: none;
}

.search-button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover {
  background-color: #0056b3;
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
.search-button {
  min-width: 50px;
}


/* Selected Text Styling */
.selected-text {
  margin-top: 20px;
  font-size: 16px;
  color: #333;
}
.input-group {
  display: flex;
  align-items: center;
  gap: 10px; /* Space between input and button */
  flex-wrap: nowrap; /* Keep input and button side-by-side */
}

/* Ensure input and button are responsive */
.search-input {
  padding: 10px;
  font-size: 16px;
  width: 250px; /* Default width */
  max-width: 100%; /* Ensure it doesn't overflow */
  border: 1px solid #ccc;
  border-radius: 5px;
}

.search-button {
  padding: 10px;
  font-size: 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover {
  background-color: #0056b3;
}

/* Media Query for Small Screens */
@media (max-width: 600px) {
  .input-group {
    flex-direction: column; /* Stack input and button vertically */
    align-items: stretch; /* Stretch to take up full width */
    gap: 10px; /* Space between stacked input and button */
  }

  .search-input {
    width: 100%; /* Make input full-width */
    font-size: 14px; /* Adjust font size for readability */
  }

  .search-button {
    width: 100%; /* Make button full-width */
    font-size: 14px; /* Adjust font size */
  }

  .horizontal-container {
    flex-direction: column; /* Stack image and content vertically */
    align-items: center; /* Center content */
    gap: 15px;
  }

  .aligned-image {
    max-width: 90%; /* Shrink image for smaller screens */
  }

  .aligned-text {
    font-size: 16px; /* Adjust text size */
    text-align: center;
  }

  .app-footer {
    flex-wrap: wrap; /* Allow wrapping if needed */
    padding: 10px; /* Adjust padding */
  }
}
</style>

