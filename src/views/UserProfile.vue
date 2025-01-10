<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js';
import { useRoute, useRouter } from 'vue-router';
import { useApplicationStore } from '@/stores/application.js';

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
  'roles': [], // User roles: ['ROLE_PATIENT', 'ROLE_DOCTOR', 'ROLE_DIAGNOSTIC']
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
    'specialtiesString': '',
  },
  'registerRequest': {
  'status': 'PENDING',
},
});

const { data, performRequest } = useRemoteData(urlRef, authRef, methodRef, formDataRef.value);

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

const addSpecialty = () => {
  formDataRef.value.diagnosticCenter.specialties.push('');
};

// Method to remove a specialty
const removeSpecialty = (index) => {
  formDataRef.value.diagnosticCenter.specialties.splice(index, 1);
};

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
            <div class="col-md-6">
              <label class="small mb-1" for="afm">AFM</label>
              <input class="form-control" id="afm" type="text" placeholder="Enter your afm"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].afm" />
            </div>
            <div class="col-md-6">
              <label class="small mb-1" for="address">Address</label>
              <input class="form-control" id="address" type="text" placeholder="Enter your address"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].address" />
            </div>
            <div class="col-md-6">
              <label class="small mb-1" for="city">City</label>
              <input class="form-control" id="city" type="text" placeholder="Enter your city"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].city" />
            </div>
            <div class="col-md-6">
              <label class="small mb-1" for="state">State</label>
              <input class="form-control" id="state" type="text" placeholder="Enter your state"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].state" />
            </div>
            <div class="col-md-6">
              <label class="small mb-1" for="doy">DOY</label>
              <input class="form-control" id="doy" type="text" placeholder="Enter your DOY"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].doy" />
            </div>
            <div class="col-md-6" v-if="profileRole.includes('ROLE_DOCTOR')">
              <label class="small mb-1" for="specialty">Specialty</label>
              <input class="form-control" id="specialty" type="text" placeholder="Enter your specialty"
                     v-model="formDataRef[profileRole.includes('ROLE_DOCTOR') ? 'doctor' : 'diagnosticCenter'].specialty" />
            </div>

            <!-- Specialties for Diagnostic Role -->
            <div class="col-md-6" v-if="profileRole.includes('ROLE_DIAGNOSTIC')" v-for="(specialty, index) in formDataRef.diagnosticCenter.specialties" :key="index">
              <label class="small mb-1" for="specialty">Specialty {{ index + 1 }}</label>
              <input class="form-control mb-2" id="specialty" type="text" placeholder="Enter specialty"
                     v-model="formDataRef.diagnosticCenter.specialties[index]" />
              <!-- Button to remove specialty -->
              <button class="btn btn-danger" @click="removeSpecialty(index)">Remove</button>
            </div>

            <!-- Button to add a new specialty -->
            <button class="btn btn-primary" @click="addSpecialty" v-if="profileRole.includes('ROLE_DIAGNOSTIC')">Add Specialty</button>


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
                  <button class="btn btn-danger" @click="removeOpeningHour(index)">Remove</button>
                </div>
              </div></div>

            <div class="button-container">
              <template v-for="day in ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']">
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

.schedule-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-item {
  display: block;
  width: 100%;
}

.form-control {
  padding: 0.5rem;
  font-size: 0.9rem;
}


/* Label styling */
.container label {
  margin-bottom: 5px; /* Space between label and input */
}

/* Input styling */
.container input {
  width: 100%;
  padding: 10px;
}

/* Ensures form fields in a small screen stack vertically */
@media (max-width: 768px) {
  .form-container {
    grid-template-columns: 1fr; /* Stacks form fields in one column on smaller screens */
  }
}
.button-container {
  display: flex;
  flex-wrap: wrap; /* Allow buttons to wrap */
  gap: 1rem; /* Space between buttons */
  margin-top: 1rem;
}

.btn-primary {
  flex: 1 1 calc(50% - 1rem); /* 2 buttons per row */
  text-align: center;
  min-width: 150px;
}

/* Styling for the input fields */
.form-control {
  width: 100%;
  padding: 0.875rem 1.125rem;
  font-size: 1rem;
  border-radius: 8px;
  background-color: #fff;
  border: 1px solid #ccc;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.2);
}
body {
  margin-top: 20px;
  background-color: #f2f6fc;
  color: #69707a;
}

/* Individual button styling */
.btn {
  flex: 1; /* Ensures buttons take up equal width and adjust dynamically */
  margin-top: 10px;
  margin-left: 0; /* Removed left margin to ensure even spacing */
  width: 100%; /* Allows the button to take the full width available within its flex container */
  text-align: center; /* Ensures text inside the button is centered */
}
.button-container {
  display: flex;
  gap: 10px; /* Adds space between the buttons */
  justify-content: space-between; /* Ensures buttons are spaced equally in the container */
}
.card {
  margin-top: 100px;
  box-shadow: 0 0.15rem 1.75rem 0 rgb(33 40 50 / 15%);
}
.card .card-header {
  font-weight: 500;
}
.card-header:first-child {
  border-radius: 0.35rem 0.35rem 0 0;
}
.card-header {
  padding: 1rem 1.35rem;
  margin-bottom: 0;
  background-color: rgba(33, 40, 50, 0.03);
  border-bottom: 1px solid rgba(33, 40, 50, 0.125);
}
.form-control,
.dataTable-input {
  display: block;
  width: 100%;
  margin-top: 10px;
  padding: 0.875rem 2rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1;
  color: #69707a;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #c5ccd6;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border-radius: 0.35rem;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.nav-borders .nav-link.active {
  color: #0061f2;
  border-bottom-color: #0061f2;
}
.nav-borders .nav-link {
  color: #69707a;
  border-bottom-width: 0.125rem;
  border-bottom-style: solid;
  border-bottom-color: transparent;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  padding-left: 0;
  padding-right: 0;
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>
