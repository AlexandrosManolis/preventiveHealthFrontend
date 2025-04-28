<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Calendar from '@/views/Calendar.vue'
import { useApplicationStore } from '@/stores/application.js'
import Swal from 'sweetalert2'
import index from 'v-calendar'
import PdfView from '@/views/PdfView.vue'
import PdfDownloadView from '@/views/PdfDownloadView.vue'
import { da } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const applicationStore = useApplicationStore()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)
const appointmentIdRef = ref(route.params.appointmentId)

const urlRef = ref(
  `${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentIdRef.value}/details`,
)
const authRef = ref(true)

const { performRequest, data } = useRemoteData(urlRef, authRef)
const formDataRef = ref({
  diagnosisDescription : '',
  recheckNeeded : '',
  medicalFileNeeded : '',
  recheckDate : null,
  medicalFile : null
});

watch(formDataRef, (newData)=>{
  console.log(newData)
  if (newData) {
    Object.assign(formDataRef.value, JSON.parse(JSON.stringify(newData)));
  }
});

onMounted(() => {
  performRequest();
})

watch(data, (newData)=>{
  formDataRef.value.diagnosisDescription = newData.diagnosisDescription || '';
  formDataRef.value.recheckNeeded = newData.recheckNeeded || '';
  formDataRef.value.medicalFileNeeded = newData.medicalFileNeeded || '';
  formDataRef.value.recheckDate = newData.recheckDate || null;
});

const goBack = () => {
  return router.back(1)
}

const destroy = (appointmentId) => {
  Swal.fire({
    title: "Cause of cancelling",
    input: "text",
    inputAttributes: {
      autocapitalize: "off"
    },
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "You need to write something!";
      }
    },
    confirmButtonText: "Submit",
    showLoaderOnConfirm: true,
    preConfirm: async (causeOfRejection) => {
      try {
        urlRef.value = `${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentId}/cancel`;
        const methodRef = ref("POST");

        // Ensure `useRemoteData` can accept a body
        const bodyRef = ref(causeOfRejection.trim());

        const { performRequest } = useRemoteData(urlRef, authRef, methodRef, bodyRef);
        const response = await performRequest();

        if (typeof response === "object") {
          return response;
        }
        if (!response.ok) {
          return Swal.showValidationMessage(`${JSON.stringify(await response.json())}`);
        }
        return response.json();
      } catch (error) {
        Swal.showValidationMessage(`Request failed: ${error}`);
      }
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      return Swal.fire({
        title: "Appointment cancelled successfully",
        icon: "success"
      });
    }
  }).then(() => {
    window.location.reload();
  });
};

const untilOneHourBefore = ref(false);

const today = new Date();
today.setHours(0,0,0,0);

untilOneHourBefore.value = (dateString, time) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() < today.getTime() || date.getTime() > today.getTime()) {
    return true;
  }

  const now = new Date();
  const nowToMinutes = now.getHours() * 60 + now.getMinutes();
  let timeInMinutes;

  if (typeof time === "string") {
    // Convert "HH:MM" string to total minutes
    const [hours, minutes] = time.split(":").map(Number);
    timeInMinutes = hours * 60 + minutes;
  } else if (time instanceof Date) {
    timeInMinutes = time.getHours() * 60 + time.getMinutes();
  } else {
    console.error("Invalid time format:", time);
    return false;
  }

  if(userRole.value.includes("ROLE_PATIENT") || userRole.value.includes("ROLE_ADMIN")){
    return (timeInMinutes - 60) > nowToMinutes;
  }else if(userRole.value.includes("ROLE_DIAGNOSTIC") || userRole.value.includes("ROLE_DOCTOR")){
    return (timeInMinutes - 360) > nowToMinutes;
  }
};

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
)

const isDropdownOpen = ref([]);

const toggleDropdown = (index) => {
  isDropdownOpen.value[index] = !isDropdownOpen.value[index]
}

const validatePdf = (event) =>{
  const file = event.target.files[0];

  if(!file){
    formDataRef.value.medicalFile = null;
    return;
  }

  if(file && file.type !== 'application/pdf'){
    Swal.fire({
      title: "Only pdf allowed",
      icon: 'error'
    });
    event.target.value = '';
    formDataRef.value.medicalFile = null;
    return;
  }
  formDataRef.value.medicalFile = file;
}

const recheckNumber = ref(null);
const recheckNumberType = ref('');

const recheckNumberToDate = ()=>{
  const today = new Date();
  if (recheckNumber.value !== null){
    if (recheckNumberType.value === 'days'){
      today.setDate(today.getDate()+ recheckNumber.value);
    }else if(recheckNumberType.value === 'months'){
      today.setMonth(today.getMonth() + recheckNumber.value);
    }else if(recheckNumberType.value === 'years'){
      today.setFullYear(today.getFullYear()+ recheckNumber.value)
    }
  }
  return formDataRef.value.recheckDate = today.toISOString().split('T')[0];
}

const onSubmit = (event)=>{
  event.preventDefault();
  if(formDataRef.value.recheckNeeded === 'YES' && data.value.appointmentStatus === 'PENDING'){
    recheckNumberToDate();
  }
  const authRef= ref(true);
  const methodRef = ref("POST");
  const urlRef = ref(`${backendEnvVar}/api/appointment/${userIdRef.value}/appointments/${appointmentIdRef.value}/complete`)
  const {performRequest} = useRemoteData(urlRef, authRef, methodRef, formDataRef);
  try{
    performRequest();
    Swal.fire({
      title: "Appointment accepted successfully",
      icon: "success"
    }).then(() => {
      window.location.reload();
    });
  }catch (err){
    Swal.fire({
      title: "An error occurred",
      icon: "error",
      text: err.message || "Something went wrong!"
    });
  }
}

const showPdfView = ref(false);
</script>

<template>
  <div class="table-container" style="display: flex; flex-direction: row; align-items: center">
    <div v-if="data">
      <h1 class="text-center">Appointment Details</h1>
      <table class="appointment-table">
        <tbody>
        <tr>
          <th>Id</th>
          <td>{{ data.id }}</td>
        </tr>
        <tr>
          <th>Doctor Name / Specialty</th>
          <td>{{ data.doctor?.fullName || data.diagnosticCenter?.fullName }} / {{ data.specialty }}</td>
        </tr>
        <tr v-if="!userRole.includes('ROLE_PATIENT')">
          <th>Patient Name</th>
          <td>{{data.patient.fullName}}</td>
        </tr>
        <tr>
          <th>Address</th>
          <td>
            {{(specialistAddress = `${data.doctor?.address || data.diagnosticCenter?.address}, ${data.doctor?.city || data.diagnosticCenter?.city}, ${data.doctor?.state || data.diagnosticCenter?.state}`) }}
            <a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specialistAddress)}`" target="_blank" class="bi bi-sign-turn-right" title="Open in Google Maps"></a>
          </td>
        </tr>
        <tr>
          <th>Date / Time</th>
          <td>{{ data.date }} / {{ data.time }}</td>
        </tr>
        <tr v-if="data.appointmentRequestStatus === 'APPROVED'">
          <th>Appointment Status</th>
          <td>{{ data.appointmentStatus }}</td>
        </tr>
        <tr v-else>
          <th>Appointment Request Status</th>
          <td>{{ data.appointmentRequestStatus }}</td>
        </tr>
        <tr>
          <th>Cause of appointment</th>
          <td>{{ data.appointmentCause }}</td>
        </tr>
        <tr v-if="data.appointmentStatus === 'COMPLETED'">
          <th>Medical file Needed? <span v-if="data.medicalFileNeeded === 'YES'">/ Medical file</span></th>
          <td>{{ data.medicalFileNeeded }}
            <div v-if="data.medicalFileNeeded === 'YES' && !userRole.includes('ROLE_PATIENT') && !data.medicalExam" style="display: flex; flex-direction: row; align-items: center; gap: 5px;">
              <span>/</span>
              <label for="inputFile">
                <span class="bi bi-upload"> Upload</span>
              </label>
              <input id="inputFile" type="file" name="upload" accept="application/pdf" @change="validatePdf">
              <div v-if="formDataRef.medicalFile">
                Selected file: {{formDataRef.medicalFile.name}}
              </div>
            </div>
            <div v-if="data.medicalFileNeeded === 'YES' && data.medicalExam">
              / <button class="btn btn-secondary">
                  <span class="bi bi-eye text-white" @click="showPdfView = !showPdfView"> View PDF</span>
                </button>
              <PdfDownloadView :id="data.medicalExam.id" v-if="userRole.includes('ROLE_PATIENT')"/>
            </div>
          </td>
        </tr>
        <tr v-if="data.appointmentStatus === 'COMPLETED'">
          <th>Recheck Needed? <span v-if="data.recheckNeeded === 'YES'">/ Recheck estimated date</span></th>
          <td>{{ data.recheckNeeded }} {{data.recheckNeeded === 'YES' ? ' / ' + data.recheckDate : ''}}</td>
        </tr>
        <tr v-if="data.appointmentStatus === 'COMPLETED'">
          <th>Diagnosis description</th>
          <td v-if="userRole.includes('ROLE_PATIENT')">{{ data.diagnosisDescription }}</td>
          <td v-if="!userRole.includes('ROLE_PATIENT')">
            <div style="width: 100%">
              <input type="text" style="width: 100%; margin-right: 10px" v-model="formDataRef.diagnosisDescription">
            </div>
            <div>
              <button type="submit" class="btn btn-primary" style="width: 100%" @click="onSubmit" :disabled="data.appointmentStatus === 'COMPLETED' && (!formDataRef.diagnosisDescription.trim() || (!formDataRef.medicalFile && data.medicalFileNeeded === 'YES'))">
                Submit
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="data.appointmentRequestStatus === 'REJECTED'">
          <th>Cause of rejection</th>
          <td>{{ data.rejectionCause }}</td>
        </tr>
        </tbody>
      </table>

      <div v-if="!userRole.includes('ROLE_PATIENT') && data.appointmentStatus === 'PENDING'" style="position: relative;">
        <button type="button" class="btn btn-success" @click="toggleDropdown(index)" style="width: 100%; margin-top: 10px;" v-if="data.appointmentStatus === 'PENDING'">
          Complete appointment
        </button>

        <div v-if="isDropdownOpen[index]" style="width: auto; padding: 10px; background: transparent; display: flex; flex-direction:column;flex-wrap: wrap;">

          <!-- Exam Needed -->
          <div class="form-group" style="margin-right: 15px;display: flex; flex-direction: row">
            <b>Medical file needed?</b>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="medicalFileNeeded" id="yes" value="YES" v-model="formDataRef.medicalFileNeeded" :checked="data.medicalFileNeeded ==='YES'">
              <label class="form-check-label" for="yes">Yes</label>
            </div>
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="medicalFileNeeded" id="no" value="NO" v-model="formDataRef.medicalFileNeeded" :checked="data.medicalFileNeeded ==='NO'">
              <label class="form-check-label" for="no">No</label>
            </div>

            <div class="form-check form-check-inline" v-if="formDataRef.medicalFileNeeded === 'YES'" style="display:flex;flex-direction: row;gap: 15px">
              <label for="inputFile">
                <span class="bi bi-upload"> Upload</span>
              </label>
              <input id="inputFile" type="file" name="upload" accept="application/pdf" @change="validatePdf">
              <div v-if="formDataRef.medicalFile">
                Selected file: {{formDataRef.medicalFile.name}}
              </div>
            </div>
          </div>

          <!-- Recheck Needed -->
          <div class="form-group" style="margin-right: 15px; display: flex; align-items: center;">
            <b style="margin-right: 10px;">Recheck needed?</b>

            <!-- Radio Buttons -->
            <div class="form-check form-check-inline" style="display: inline-flex; align-items: center;">
              <input class="form-check-input" type="radio" name="recheck" id="recheckYes" value="YES" v-model="formDataRef.recheckNeeded">
              <label class="form-check-label" for="recheckYes" style="margin-left: 5px;">Yes</label>
            </div>
            <div class="form-check form-check-inline" style="display: inline-flex; align-items: center; margin-left: 10px;">
              <input class="form-check-input" type="radio" name="recheck" id="recheckNo" value="NO" v-model="formDataRef.recheckNeeded">
              <label class="form-check-label" for="recheckNo" style="margin-left: 5px;">No</label>
            </div>

            <!-- Recheck Duration (if needed) -->
            <div v-if="formDataRef.recheckNeeded === 'YES'" class="form-group" style="display: flex; align-items: center; margin-left: 15px;">
              <span><b>Recheck in:</b></span>
              <input type="number" min="1" v-model="recheckNumber" style="width: auto; margin-left: 5px; margin-right: 5px; background-color: transparent; border: 1px solid #ccc;">
              <select class="btn" v-model="recheckNumberType">
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>

          </div>
          <div>
            <span style="margin-right: 5px;"><b>Diagnostic results description:</b></span>
            <input type="text" style="width: 100%; margin-bottom: 5px" v-model="formDataRef.diagnosisDescription">
          </div>

          <div>
            <button type="submit" class="btn btn-primary" style="width: 100%" @click="onSubmit"
                    :disabled="!formDataRef.recheckNeeded || !formDataRef.diagnosisDescription.trim() || (formDataRef.recheckNeeded === 'YES' && (!recheckNumberType || !recheckNumber)) || !formDataRef.medicalFileNeeded">
              Submit
            </button>
          </div>
        </div>
      </div>

      <div style="margin-top: 5px">
        <button class="btn btn-secondary" @click="goBack">Back</button>
        <button style="float: right; margin-left: 5px" class="btn btn-danger" @click="destroy" v-if="data.appointmentStatus === 'PENDING' && untilOneHourBefore(data.date, data.time)">
          Cancel appointment
        </button>
      </div>
      <Calendar :data="data" :specialty="data.specialty" calendar-type="changeAppointment" v-if="userRole.includes('ROLE_PATIENT') && !data.appointmentStatus === 'COMPLETED'"/>
    </div>
  </div>
  <PdfView :appointmentId="data.id" v-if="showPdfView"/>
</template>

<style scoped>
#inputFile{display: none}

input[type="radio"]{
  display: none;
}
label{
  cursor: pointer;
  display: inline-flex;
  gap: 0.4em;
  border: 3px solid black;
  padding: 0.1em 0.1em;
  border-radius: 0.5em;
}
label:before{
  content: "";
  height: 0.5em;
  width: 0.5em;
  border: 3px solid #181818;
  border-radius: 50%;
}
input[type="radio"]:checked + label:before{
  height: 0.25em;
  width: 0.25em;
  border: 0.3em solid white;
  background-color: #181818;
}
input[type="radio"]:checked + label{
  background-color: #181818;
  color: white;
}

.appointment-table, .appointment-table tbody{
  display: block;
  width: 100vh;
  overflow: auto;
}

.appointment-table tr {
  display: block;
  border-radius: 10px;
  margin-bottom: 15px;
  padding: 10px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.appointment-table td {
  display: flex;
  justify-content: flex-start;
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
}

.table-container {
  margin-top: 60px;
  padding: 20px;
}
</style>
