<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js';
import { useRoute, useRouter } from 'vue-router';
import { useApplicationStore } from '@/stores/application.js';
import Multiselect from 'vue-multiselect'
import "vue-multiselect/dist/vue-multiselect.min.css";

const backendEnvVar = import.meta.env.VITE_BACKEND;
const applicationStore = useApplicationStore();

const route = useRoute();
const router = useRouter();
const userIdRef = ref(route.params.id);

const urlRef = ref(`${backendEnvVar}/api/user/${userIdRef.value}/profile`);
const authRef = ref(true);
const methodRef = ref("GET");


const formDataRef = ref({
  'username': '',
  'email': '',
  'fullName': '',
  'phoneNumber': '',
  'roles': [],
  'patient': {
    'gender': '',
    'birthday': '',
    'amka': '',
  },
  'doctor': {
    'address': '',
    'city': '',
    'state': '',
    'specialty': '',
    'doy': '',
    'afm': '',
    'openingHours': [],
  },
  'diagnosticCenter': {
    'address': '',
    'city': '',
    'state': '',
    'afm': '',
    'openingHours': [],
    'specialties': [],
  },
  'registerRequest': {
    'status': 'PENDING',
  },
});

const { data, performRequest } = useRemoteData(urlRef, authRef, methodRef);

const selectSpecialties= ref([]);

onMounted(async ()=>{
  performRequest();
  if(!userRole.value.includes('ROLE_PATIENT')){
    try{
      urlRef.value = `${backendEnvVar}/api/user/specialties`;
      const {performRequest} = useRemoteData(urlRef, authRef)
      const response = await performRequest()

      if (response === null || response === undefined) {
        throw new Error("No data received from the backend.");
      }else{
        if (typeof response[0] === 'string') {
          selectSpecialties.value = response;
        }
        else {
          selectSpecialties.value = response.map(item => item.name);
        }
      }
    }catch (err){
      console.error("Error fetching:", err);
    }

  }
});

// Watch fetched data to populate form fields
watch(data, (newData) => {
  if (newData) {
    // Deeply merge the new data into formDataRef
    Object.assign(formDataRef.value, JSON.parse(JSON.stringify(newData)));
  }
});

const onSubmit = async (event) => {
  event.preventDefault();
  if(profileRole.value.includes('ROLE_PATIENT')){
    formDataRef.value.doctor = null;
    formDataRef.value.diagnosticCenter = null;
  }else if(profileRole.value.includes('ROLE_DOCTOR')){
    formDataRef.value.diagnosticCenter = null;
    formDataRef.value.patient = null;
  }else if(profileRole.value.includes('ROLE_DIAGNOSTIC')){
    formDataRef.value.patient = null;
    formDataRef.value.doctor = null;
  }else if(profileRole.value.includes('ROLE_ADMIN')){
    formDataRef.value.patient = null;
    formDataRef.value.doctor = null;
    formDataRef.value.diagnosticCenter = null;
  }

  // Ensure registerRequest is defined
  if (!formDataRef.value.registerRequest) {
    formDataRef.value.registerRequest = { status: 'PENDING' };
  }

  // Update API endpoint and method
  urlRef.value = `${backendEnvVar}/api/user/${userIdRef.value}/edit-profile`;
  methodRef.value = "POST";

  const {error, performRequest } = useRemoteData(urlRef, authRef, methodRef,formDataRef);

  console.log("Submitting form data:",formDataRef.value);

  // Perform request
  await performRequest();

  if (!error.value) {
    console.log("Profile updated successfully:", formDataRef.value);
    // Optionally fetch updated profile again
    urlRef.value = `${backendEnvVar}/api/user/${userIdRef.value}/profile`;
    methodRef.value = "GET";
    const {performRequest} = useRemoteData(urlRef, authRef, methodRef);
    performRequest(); // Refresh data
  } else {
    console.error("Error updating profile:", error.value);
  }
};

const loggedInUsername = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.username : null,
)
const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : [],
)

const profileRole = ref('');
watch(() => formDataRef.value.roles, () => {
  if (formDataRef.value.roles && formDataRef.value.roles.length > 0) {
    profileRole.value = formDataRef.value.roles[0].roleName;
  }
});

// Method to check if a openingHours exists for a specific day
const openingHoursExists = (day) => {
  const openingHours = profileRole.value.includes('ROLE_DOCTOR')
    ? formDataRef.value.doctor.openingHours
    : formDataRef.value.diagnosticCenter.openingHours;

  return openingHours.some(openingHour => openingHour.dayOfWeek.toLowerCase() === day.toLowerCase());
};

// Method to add a openingHour for a specific day
const addOpeningHour = (day) => {
  const newOpeningHour = {
    dayOfWeek: day,
    startTime: '', // Default empty
    endTime: '',   // Default empty
  };
  if (profileRole.value.includes('ROLE_DOCTOR')) {
    formDataRef.value.doctor.openingHours.push(newOpeningHour);
  } else {
    formDataRef.value.diagnosticCenter.openingHours.push(newOpeningHour);
  }
};

const removeOpeningHour = (index) => {
  console.log("Before Remove: ", profileRole.value.includes('ROLE_DOCTOR')
    ? formDataRef.value.doctor.openingHours
    : formDataRef.value.diagnosticCenter.openingHours);

  const openingHours = profileRole.value.includes('ROLE_DOCTOR')
    ? formDataRef.value.doctor.openingHours
    : formDataRef.value.diagnosticCenter.openingHours;

  if (index >= 0 && index < openingHours.length) {
    openingHours.splice(index, 1);
    console.log("After Remove: ", openingHours);
  }
};

const goback = () => router.push('/')
</script>

<template>
  <div class="profile-container">

    <div class="profile-wrapper" v-if="userRole.includes('ROLE_ADMIN') || formDataRef.username === loggedInUsername">
      <div class="profile-card">
        <div class="profile-header">
          <h2>Account Details</h2>
          <p class="subtitle">Manage your personal information</p>
          <div v-if="(profileRole.includes('ROLE_DOCTOR') || profileRole.includes('ROLE_DIAGNOSTIC')) && data.registerRequest.status === 'REJECTED'" class="rejection-notice">
            <div class="alert">
              <div class="alert-icon">
                <i class="bi bi-exclamation-circle"></i>
              </div>
              <div class="alert-content">
                <h3>Your registration has been rejected</h3>
                <p>{{data.registerRequest.description}}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-body">
          <form>
            <div class="form-section">
              <h3 class="section-title">Basic Information</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="inputUsername">Username</label>
                  <input class="input-field" id="inputUsername" type="text" placeholder="Enter your username" v-model="formDataRef.username" />
                </div>

                <div class="form-group">
                  <label for="inputEmailAddress">Email address</label>
                  <input class="input-field" id="inputEmailAddress" type="email" placeholder="Enter your email address" v-model="formDataRef.email" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="fullName">Full name</label>
                  <input class="input-field" id="fullName" type="text" placeholder="Enter your full name" v-model="formDataRef.fullName" />
                </div>

                <div class="form-group">
                  <label for="phoneNumber">Phone Number</label>
                  <input class="input-field" id="phoneNumber" type="text" placeholder="Enter your phone number" v-model="formDataRef.phoneNumber" />
                </div>
              </div>
            </div>

            <!-- For Role patient-->
            <div class="form-section" v-if="profileRole.includes('ROLE_PATIENT')">
              <h3 class="section-title">Patient Information</h3>
              <div class="form-row">
                <div class="form-group">
                  <label for="amka">AMKA</label>
                  <input class="input-field" id="amka" type="text" placeholder="Enter your AMKA" v-model="formDataRef.patient.amka" />
                </div>

                <div class="form-group">
                  <label for="gender">Gender</label>
                  <input class="input-field" id="gender" type="text" placeholder="Enter your gender" v-model="formDataRef.patient.gender" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="birthday">Birthday</label>
                  <input class="input-field" id="birthday" type="date" placeholder="Enter your birthday" v-model="formDataRef.patient.birthday" />
                </div>
              </div>
            </div>

            <div class="form-section" v-if="profileRole.includes('ROLE_DOCTOR') || profileRole.includes('ROLE_DIAGNOSTIC') ">
              <h3 class="section-title">{{ profileRole.includes('ROLE_DOCTOR') ? 'Doctor' : 'Diagnostic Center' }} Information</h3>

              <div class="form-row">
                <div class="form-group">
                  <label for="afm">AFM</label>
                  <input class="input-field" id="afm" type="text" placeholder="Enter your AFM" v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].afm" />
                </div>

                <div class="form-group">
                  <label for="doy">DOY</label>
                  <input class="input-field" id="doy" type="text" placeholder="Enter your DOY" v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].doy" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="address">Address</label>
                  <input class="input-field" id="address" type="text" placeholder="Enter your address" v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].address" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">City</label>
                  <input class="input-field" id="city" type="text" placeholder="Enter your city" v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].city" />
                </div>

                <div class="form-group">
                  <label for="state">State</label>
                  <input class="input-field" id="state" type="text" placeholder="Enter your state" v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].state" />
                </div>
              </div>

              <!-- Specialty for Doctor -->
              <div class="form-row" v-if="profileRole.includes('ROLE_DOCTOR')">
                <div class="form-group">
                  <label for="specialty">Specialty</label>
                  <multiselect v-model="formDataRef.doctor.specialty" :options="selectSpecialties" :searchable="false"
                               :close-on-select="true" placeholder="Select your specialty" class="multiselect-modern">
                  </multiselect>
                </div>
              </div>

              <!-- Specialties for Diagnostic Centers -->
              <div class="form-row" v-if="profileRole.includes('ROLE_DIAGNOSTIC')">
                <div class="form-group">
                  <label for="specialties">Specialties</label>
                  <multiselect v-model="formDataRef.diagnosticCenter.specialties" :options="selectSpecialties" :multiple="true"
                               :searchable="false" :taggable="true" :close-on-select="false" placeholder="Select specialties" class="multiselect-modern">
                  </multiselect>
                </div>
              </div>
            </div>

            <!-- Opening Hours Section -->
            <div class="form-section" v-if="profileRole.includes('ROLE_DOCTOR') || profileRole.includes('ROLE_DIAGNOSTIC')">
              <h3 class="section-title">Opening Hours</h3>
              <p class="section-subtitle">Set your availability</p>

              <div class="opening-hours-grid">
                <div v-for="(openingHour, index) in (profileRole.includes('ROLE_DOCTOR') ? formDataRef.doctor.openingHours : formDataRef.diagnosticCenter.openingHours)"
                  :key="openingHour.dayOfWeek + openingHour.startTime" class="opening-hours-card">
                  <div class="opening-hours-day">{{ openingHour.dayOfWeek }}</div>
                  <div class="opening-hours-inputs">
                    <div class="time-input-group">
                      <label>From</label>
                      <input type="time" class="time-input" v-model="openingHour.startTime" />
                    </div>

                    <div class="time-input-group">
                      <label>To</label>
                      <input type="time" class="time-input" v-model="openingHour.endTime" />
                    </div>
                  </div>

                  <button class="btn-remove" type="button" @click="removeOpeningHour(index)">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>

              <div class="add-hours-container">
                <template v-for="day in ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']">
                  <button v-if="!openingHoursExists(day)" :key="day" class="btn-add-hours" @click="addOpeningHour(day)" type="button">
                    <i class="bi bi-plus-lg"></i> {{ day }}
                  </button>
                </template>
              </div>
            </div>

            <div class="actions-container">
              <button class="btn-cancel" type="button" @click="goback">Cancel</button>
              <button class="btn btn-primary" type="button" @click="onSubmit">Save changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Main Container */
.profile-container {
  margin-top: 60px;
  padding: 2rem;
  background-color: transparent;
}

.profile-wrapper {
  margin: 0 auto;
}

.profile-card {
  background-color: transparent;
  overflow: hidden;
  margin-top: 2rem;
}

/* Header */
.profile-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8f9fa;
}

.profile-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.subtitle {
  color: #6b7280;
  margin-top: 0.25rem;
  font-size: 0.875rem;
}

/* Form */
.profile-body {
  padding: 2rem;
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.section-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: -0.5rem;
  margin-bottom: 1rem;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
  min-width: 250px;
}

label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.input-field {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1f2937;
  background-color: #fff;
  transition: all 0.2s ease;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-field::placeholder {
  color: #9ca3af;
}

.alert {
  display: flex;
  background-color: #fee2e2;
  border-radius: 0.5rem;
  padding: 1rem;
  border-left: 4px solid #ef4444;
}

.alert-icon {
  flex-shrink: 0;
  color: #ef4444;
  margin-right: 1rem;
}

.alert-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #b91c1c;
}

.alert-content p {
  margin: 0;
  color: #7f1d1d;
  font-size: 0.875rem;
}

/* Opening Hours */
.opening-hours-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.opening-hours-card {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  position: relative;
}

.opening-hours-day {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.opening-hours-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.time-input-group {
  flex: 1;
}

.time-input-group label {
  font-size: 0.75rem;
  color: #6b7280;
}

.time-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.btn-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  color: #ef4444;
  background-color: #fee2e2;
}

.add-hours-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-add-hours {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  color: #4b5563;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-hours:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

/* Button styles */
.actions-container {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel {
  background-color: #f9fafb;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

/* Multiselect styling */
.multiselect-modern {
  border-radius: 0.5rem !important;
  border: 1px solid #d1d5db !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .profile-container {
    padding: 1rem;
  }

  .profile-body {
    padding: 1.5rem;
  }

  .form-group {
    min-width: 100%;
  }

  .actions-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .btn-cancel {
    width: 100%;
  }
}
</style>
