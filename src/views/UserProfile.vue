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

// Watch fetched data to populate form fields
watch(data, (newData) => {
  if (newData) {
    // Deeply merge the new data into formDataRef
    Object.assign(formDataRef.value, JSON.parse(JSON.stringify(newData)));
  }
});

// Fetch profile details on mount
onMounted(() => {
  performRequest();
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
const profileRole = computed(() =>
  formDataRef.value.roles?.[0]?.roleName
);

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

const selectSpecialties= ref([]);

onMounted(async ()=>{
  const response = await fetch(`${backendEnvVar}/api/user/specialties`);
  if(response.ok){
    const data = await response.json();
    selectSpecialties.value = data.map(item => item.name);
  }else {
    console.error('Error fetching specialties:', response.statusText);
  }
});

const goback = () => router.push('/')
</script>

<template>
  <div class="container" v-if="userRole.includes('ROLE_ADMIN') || formDataRef.username === loggedInUsername">
    <!-- Account details card-->
    <div class="card mb-4">
      <div class="card-header text-center">Account Details</div>
      <div class="card-body">
        <form>
        <div class="row">
          <!-- Username -->
          <div class="col-md-6 mb-3">
            <label class="small mb-1" for="inputUsername">Username</label>
            <input class="form-control" id="inputUsername" type="text" placeholder="Enter your username" v-model="formDataRef.username" />
          </div>

          <!-- Email Address -->
          <div class="col-md-6 mb-3">
            <label class="small mb-1" for="inputEmailAddress">Email address</label>
            <input class="form-control" id="inputEmailAddress" type="email" placeholder="Enter your email address" v-model="formDataRef.email" />
          </div>
        </div>

        <div class="row">
          <!-- Full Name -->
          <div class="col-md-6 mb-3">
            <label class="small mb-1" for="fullName">Full name</label>
            <input class="form-control" id="fullName" type="text" placeholder="Enter your full name" v-model="formDataRef.fullName" />
          </div>

          <!-- Phone Number -->
          <div class="col-md-6 mb-3">
            <label class="small mb-1" for="phoneNumber">Phone Number</label>
            <input class="form-control" id="phoneNumber" type="text" placeholder="Enter your phone number" v-model="formDataRef.phoneNumber" />
          </div>
        </div>

        <!-- For Role patient-->
        <div class="row gx-3 mb-3" v-if="profileRole.includes('ROLE_PATIENT')">
          <div class="col-md-6">
            <label class="small mb-1" for="amka">AMKA</label>
            <input class="form-control" id="amka" type="text" placeholder="Enter your AMKA"
                   v-model="formDataRef.patient.amka" />
          </div>
          <div class="col-md-6">
            <label class="small mb-1" for="gender">Gender</label>
            <input class="form-control" id="gender" type="text" placeholder="Enter your gender"
                   v-model="formDataRef.patient.gender" />
          </div>
          <div class="col-md-6">
            <label class="small mb-1" for="birthday">Birthday</label>
            <input class="form-control" id="birthday" type="date" placeholder="Enter your birthday"
                   v-model="formDataRef.patient.birthday" />
          </div>
          </div>
          <div class="row gx-3 mb-3" v-if="profileRole.includes('ROLE_DOCTOR') || profileRole.includes('ROLE_DIAGNOSTIC')">
            <div class="col-md-4">
              <label class="small mb-1" for="afm">AFM</label>
              <input class="form-control" id="afm" type="text" placeholder="Enter your afm"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].afm" />
            </div>
            <div class="col-md-4">
              <label class="small mb-1" for="address">Address</label>
              <input class="form-control" id="address" type="text" placeholder="Enter your address"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].address" />
            </div>
            <div class="col-md-4">
              <label class="small mb-1" for="city">City</label>
              <input class="form-control" id="city" type="text" placeholder="Enter your city"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].city" />
            </div>
            <div class="col-md-4">
              <label class="small mb-1" for="state">State</label>
              <input class="form-control" id="state" type="text" placeholder="Enter your state"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].state" />
            </div>
            <div class="col-md-4">
              <label class="small mb-1" for="doy">DOY</label>
              <input class="form-control" id="doy" type="text" placeholder="Enter your DOY"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].doy" />
            </div>

            <!-- Specialty for Doctor -->
            <div class="col-md-4" v-if="profileRole.includes('ROLE_DOCTOR')">
              <label class="small mb-1" for="specialty">Specialty</label>
              <multiselect v-model="formDataRef.doctor.specialty" :options="selectSpecialties" :searchable="false"
                           :close-on-select="true" placeholder="Select your specialty" class="form-control">
              </multiselect>
            </div>

            <!-- Specialties for Diagnostic Centers -->
            <div class="col-md-4" v-if="profileRole.includes('ROLE_DIAGNOSTIC')">
              <label class="small mb-1" for="specialties">Specialties</label>
              <multiselect v-model="formDataRef.diagnosticCenter.specialties" :options="selectSpecialties" :multiple="true"
                           :searchable="false" :taggable="true" :close-on-select="false" placeholder="Select specialties">
              </multiselect>
            </div>

          <!-- openingHours for Doctor or Diagnostic Role -->
          <div class="col-md-6" v-if="profileRole.includes('ROLE_DOCTOR') || profileRole.includes('ROLE_DIAGNOSTIC')" v-for="(openingHour, index) in (profileRole.includes('ROLE_DOCTOR') ? formDataRef.doctor.openingHours : formDataRef.diagnosticCenter.openingHours)" :key="openingHour.dayOfWeek + openingHour.startTime">
            <div class="schedule-container ">
              <div class="schedule-item">
                <!-- Day of Week -->
                <label class="form-control">Day of Week</label>
                <input type="text" class="form-control" v-model="openingHour.dayOfWeek" readonly />

                <!-- Start Time -->
                <label class="form-control">Start Time</label>
                <input type="time" class="form-control" v-model="openingHour.startTime" />

                <!-- End Time -->
                <label class="form-control">End Time</label>
                <input type="time" class="form-control" v-model="openingHour.endTime" />

                <!-- Remove Button -->
                <div class="button-container">
                  <button class="btn btn-danger" @click="removeOpeningHour(index)">Remove</button>
                </div>
              </div>
            </div>
          </div>

          <div class="button-container">
            <template v-for="day in ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']">
              <button :key="day" class="btn btn-primary" v-if="!openingHoursExists(day)" @click="addOpeningHour(day)">
                Add Opening Hour for {{ day }}
              </button>
            </template>
          </div>
          </div>
          <!-- Save changes button-->
          <div class="button-container">
            <button class="btn btn-danger" type="button" @click="goback">Cancel</button>
            <button class="btn btn-primary" type="button" @click="onSubmit" >Save changes</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>

body {
  margin-top: 20px;
  background-color: #f2f6fc;
  color: #69707a;
}

/* Container Styles */
.schedule-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item {
  display: block;
  width: 100%;
}

/* Form Styles */
.form-control {
  width: 100%;
  padding: 0.875rem 1.125rem;
  font-size: 1rem;
  border: 1px solid #c5ccd6;
  border-radius: 8px;
  background-color: #fff;
  color: #69707a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  margin-top: 10px;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
}

label {
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 10px;
}

/* Button Styles */
.button-container {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  flex: 1 1 calc(50% - 1rem);
  text-align: center;
  min-width: 150px;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: #fff;
  border: none;
  cursor: pointer;
  margin-top: 5px;
  transition: background-color 0.3s ease;
}

/* Card Styles */
.card {
  margin-top: 100px;
  box-shadow: 0 0.15rem 1.75rem rgb(33 40 50 / 15%);
}

.card-header {
  font-weight: 500;
  padding: 1rem 1.35rem;
  background-color: rgba(33, 40, 50, 0.03);
  border-bottom: 1px solid rgba(33, 40, 50, 0.125);
  border-radius: 0.35rem 0.35rem 0 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .form-container {
    grid-template-columns: 1fr;
  }

  .btn {
    flex: 1 1 100%;
    min-width: unset;
  }
}
</style>
