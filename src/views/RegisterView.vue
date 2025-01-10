<script setup xmlns="http://www.w3.org/1999/html">
import { ref, computed, watch } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute, useRouter } from 'vue-router'

const backendEnvVar = import.meta.env.VITE_BACKEND
const route = useRoute()
const router = useRouter()

const formDataRef = ref({
  'username': '', 'password': '', 'email': '', 'fullName': '', 'phoneNumber': '',
  'gender': '', 'birthday': '', 'amka': '',
  'address': '', 'city': '', 'state': '', 'specialty': '', 'doy': '', 'afm': '', 'openingHours': [],
  'specialties': [], 'specialtiesString': ''
})


const errorRef = ref(null)
const successRef = ref(null)
const userType = computed(() => route.query.userType)

const urlRef = computed(() => backendEnvVar + '/api/auth/signup/' + userType.value)
const authRef = ref(false)
const methodRef = ref('POST')

const { performRequest } = useRemoteData(urlRef, authRef, methodRef, formDataRef)

const currentStep = ref(1) // Track the current step of the form

watch(userType, () => {
  currentStep.value = 1
  Object.keys(formDataRef.value).forEach(key => formDataRef.value[key] = Array.isArray(formDataRef.value[key]) ? [] : '')
})

const showError = (message) => {
  errorRef.value = message
  setTimeout(() => errorRef.value = null, 6000)
  return false
}

const prepareSpecialtiesInput = () => {
  formDataRef.value.specialties = formDataRef.value.specialtiesString.split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

const validateFormData = () => {
  const {
    username, password, email, fullName, phoneNumber, gender, birthday, amka,
    address, city, state, specialty, doy, afm, openingHours, specialties
  } = formDataRef.value

  // Common Validations
  if (!username || !password || !email || !fullName || !phoneNumber) {
    return showError('Please fill in all required fields.')
  }

  if (username.length < 3) {
    return showError('Username must be at least 3 characters.')
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return showError('Email must follow the format \'example@example.com\'.')
  }

  if (password.length < 6) {
    return showError('Password must be at least 6 characters long.')
  }

  if (!/^[A-Za-z]+(\s[A-Za-z]+)+$/.test(fullName)) {
    return showError('Full name must include one or more first names followed by a last name.')
  }

  if (!/^\+?\d{10,15}$/.test(phoneNumber)) {
    return showError('Phone number must be valid (10-15 digits).')
  }

  // Patient-Specific Validations
  if (userType.value.includes('patient')) {
    if (!gender || !birthday || !amka) {
      return showError('Please fill in all patient-specific fields.')
    }

    if (!/^\d{11}$/.test(amka)) {
      return showError('AMKA must be exactly 11 digits.')
    }

    // Validate if birthday is in the past
    const today = new Date()
    const birthDate = new Date(birthday)
    if (birthDate >= today) {
      return showError('Birthday must be in the past.')
    }

    const dob = new Date(birthday)
    const dobYear = dob.getFullYear().toString().slice(2)
    const dobMonth = ('0' + (dob.getMonth() + 1)).slice(-2)
    const dobDay = ('0' + dob.getDate()).slice(-2)
    const amkaBirth = dobDay + dobMonth + dobYear

    if (amka.slice(0, 6) !== amkaBirth) {
      return showError('AMKA\'s first 6 digits must match the date of birth (DDMMYY).')
    }

  }

  // Doctor/Diagnostic-Specific Validations
  if (userType.value.includes('doctor') || userType.value.includes('diagnostic')) {
    if (!address || !city || !state || !afm || !doy) {
      return showError('Please fill in all doctor/diagnostic-specific fields.')
    }
    if(userType.value.includes('doctor') && !specialty){
      return showError('Specialty is required for doctors.')
    }
    if (userType.value.includes('diagnostic') && (specialties.length === 0)) {
      return showError('At least one specialty is required for diagnostics.')
    }

    if (!/^\S+\s+\d+$/.test(address)) {
      return showError('Address must be in the format \'Street number\'.')
    }

    if (!/^\d{9}$/.test(afm)) {
      return showError('AFM must be exactly 9 digits.')
    }

    if (userType.value.includes('doctor') && specialty.trim().length === 0) {
      return showError('Specialty is required for doctors.')
    }

  }

  return true // All validations passed
}


const checkUserExistence = async (username, email) => {
  try {
    const response = await fetch(`${backendEnvVar}/api/auth/check-user?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}`)
    if (!response.ok) {
      console.error('Error fetching user existence:', response.statusText)
      return false // Assume user does not exist if the request fails
    }
    const data = await response.json()
    return data.exists // Backend returns true if user exists
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}

const prepareOpeningHourInput = () => {
  const formatTime = (time) => {
    if (!time) return null
    const match24 = time.match(/^(\d{1,2}):(\d{2})$/)
    const match12 = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i)

    if (match24) {
      const [_, hours, minutes] = match24.map(Number)
      return hours < 24 && minutes < 60 ? `${hours.toString().padStart(2, '0')}:${minutes}` : null
    }

    if (match12) {
      let [_, hours, minutes, period] = match12
      hours = parseInt(hours, 10)
      minutes = parseInt(minutes, 10)
      if (hours <= 12 && minutes < 60) {
        if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0
        return `${hours.toString().padStart(2, '0')}:${minutes}`
      }
    }

    return null
  }

  formDataRef.value.openingHours = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
    .map((day, index) => {
      const startTime = formatTime(formDataRef.value[`startTime${index}`])
      const endTime = formatTime(formDataRef.value[`endTime${index}`])

      // Check user type
      const isDoctor = userType.value.includes('doctor')
      const specialty = formDataRef.value.specialty // Single specialty for doctors
      const specialtiesArray = formDataRef.value.specialties || []
      const specialtiesString = specialtiesArray.join(', ') // Convert array to string

      if (startTime && endTime && (isDoctor ? specialty : specialtiesString)) {
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)

        if (endH * 60 + endM > startH * 60 + startM) {
          return {
            dayOfWeek: day,
            startTime,
            endTime,
            specialty: isDoctor ? specialty : specialtiesString // Use specialty or specialtiesString
          }
        }
      }
      return null
    })
    .filter(Boolean)
}

const onSubmit = async (event) => {
  event.preventDefault()

  prepareSpecialtiesInput()

  // Perform synchronous validation
  if (!validateFormData()) return


  // Perform asynchronous validation
  try {
    const isUserExist = await checkUserExistence(formDataRef.value.username, formDataRef.value.email)

    if (isUserExist) {
      showError('Username or email already exists.')
      return // Stop submission if user exists
    }

    // Prepare data and submit the form
    prepareOpeningHourInput()
    await performRequest()
    setTimeout(() => {
      successRef.value = `${capitalize(userType.value)} registered successfully! Redirecting to home screen...`
      // Redirect to the home screen after 2 seconds
      setTimeout(() => {router.push('/login')}, 2000)
    }, 500)

  } catch (error) {
    console.error('Error during registration:', error.message)
    showError('An error occurred during registration.')
  }
}


const goToPreviousStep = () => {
  if (currentStep.value > 1) currentStep.value--
}

const goToNextStep = () => {
  if (currentStep.value < 2) currentStep.value++
}

const goback = () => router.push('/')
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)
</script>

<template>
  <div class="register-container text-white">
    <h1>Sign Up as a {{capitalize(userType)}}</h1>
  </div>
  <div class="signup-card">
    <div v-if="currentStep === 1">
      <h2 class="text-center">General Information</h2>
      <div class="form-group">
        <label for="username">Username</label>
        <input v-model="formDataRef.username" class="form-control" id="username" placeholder="Username" required />

        <label for="email">Email</label>
        <input v-model="formDataRef.email" class="form-control" placeholder="Email" id="email" type="email" required />

        <label for="password">Password</label>
        <input v-model="formDataRef.password" class="form-control" placeholder="Password" id="password" type="password" required />

        <label for="fullName">Full Name</label>
        <input v-model="formDataRef.fullName" class="form-control" id="fullName" placeholder="Full Name" required />

        <label for="phoneNumber">Phone Number</label>
        <input v-model="formDataRef.phoneNumber" class="form-control" id="phoneNumber" placeholder="Phone Number" required />
      </div>
      <div class="actions">
        <button type="button" class="btn btn-danger" @click="goback">Cancel</button>
        <button type="button" class="btn btn-primary" @click="goToNextStep">Next</button>
      </div>
    </div>

    <!-- Step 2 -->
    <div v-if="currentStep === 2">
      <h2 class="text-center">Additional Information</h2>
      <div class="form-group">
        <!-- Patient-Specific Fields -->
        <div v-if="userType.includes('patient')">
          <label for="gender">Gender</label>
          <select id="gender" class="form-control" v-model="formDataRef.gender">
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>

          <label for="birthday">Birthday</label>
          <input id="birthday" class="form-control" v-model="formDataRef.birthday" type="date" />

          <label for="amka">AMKA</label>
          <input id="amka" class="form-control" v-model="formDataRef.amka" type="text" placeholder="Enter AMKA" />
        </div>

        <!-- Doctor/Diagnostic Fields -->
        <div v-if="userType.includes('doctor') || userType.includes('diagnostic')">
          <label for="address">Address</label>
          <input id="address" class="form-control" v-model="formDataRef.address" type="text" placeholder="Street number" />

          <label for="city">City</label>
          <input id="city" class="form-control" v-model="formDataRef.city" type="text" placeholder="Enter city" />

          <label for="state">State</label>
          <input id="state" class="form-control" v-model="formDataRef.state" type="text" placeholder="Enter state" />

          <label for="afm">AFM</label>
          <input id="afm" class="form-control" v-model="formDataRef.afm" type="text" placeholder="Enter AFM" />

          <label for="doy">DOY</label>
          <input id="doy" class="form-control" v-model="formDataRef.doy" type="text" placeholder="Enter DOY" />

          <div v-if="userType.includes('doctor')">
            <label for="specialty">Specialty</label>
            <input id="specialty" class="form-control" v-model="formDataRef.specialty" type="text" placeholder="Enter specialty" />
          </div>

          <div v-if="userType.includes('diagnostic')">
            <label for="specialties">Specialties</label>
            <input id="specialties" class="form-control" v-model="formDataRef.specialtiesString" type="text" placeholder="Enter specialties (comma-separated)" />
          </div>

          <!-- Schedule Section -->
          <div class="schedule-container">
            <h3 class="schedule-title">Weekly Opening Hours</h3>
            <div v-for="(day, index) in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']" :key="index" class="schedule-row">
              <label class="schedule-day">{{ day }}</label>
              <div class="time-fields">
                <input v-model="formDataRef[`startTime${index}`]" type="time" class="time-input form-control" placeholder="Start time" />
                <span class="time-separator">-</span>
                <input v-model="formDataRef[`endTime${index}`]" type="time" class="time-input form-control" placeholder="End time" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="goToPreviousStep">Back</button>
        <button class="btn btn-primary" @click="onSubmit">Submit</button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="errorRef" class="alert alert-danger error-text">{{ errorRef }}</div>
    <div v-if="successRef" class="alert alert-success success-text">{{ successRef }}</div>
  </div>
</template>


<style scoped>

/* Schedule Section Styling */
.schedule-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.schedule-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #34495e;
  margin-bottom: 20px;
}

.schedule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.schedule-day {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  flex-basis: 30%;
}

.time-fields {
  flex-basis: 70%;
  display: flex;
  align-items: center;
  gap: 10px;
}

.time-input {
  width: 100%;
  padding: 10px;
  font-size: 1rem;
  border: 1px solid #dcdcdc;
  border-radius: 5px;
  outline: none;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.time-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
}

.time-separator {
  font-size: 1rem;
  color: #7f8c8d;
}

.register-container {
  display: flex;
  overflow: visible; /* Allow content to grow outside */
  max-height: none; /* Remove any maximum height restrictions */
  justify-content: center; /* Center horizontally */
  align-items: center; /* Center vertically */
  width: 100%;
  min-width: 50vh;
  min-height: 50vh;
  box-sizing: border-box;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  background: linear-gradient(315deg, #007bff 0%,  #182b3a 80%);
  border-radius: 16px;
  gap: 10px;
  margin-top: 60px;
  padding: 5px 10px;
}

/* Card styling */
.signup-card {
  overflow: visible; /* Allow content to grow outside */
  max-height: none; /* Remove any maximum height restrictions */
  width: 100%;
  min-width: 50vh;
  min-height: 50vh;
  background: whitesmoke;
  box-sizing: border-box;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  padding: 5px 10px;
  transition: all 0.3s ease;
  gap: 10px;
  margin-top: 60px
}

.signup-card form {
  flex-grow: 1;
}


/* Form header */
.header h1 {
  font-size: clamp(1.5rem, 2vw, 2rem);
  color: #2c3e50;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
}

/* Form groups */
.form-group {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group label {
  font-weight: 600;
  color: #34495e;
  font-size: 1rem;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #bdc3c7;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #3498db;
  outline: none;
}

/* Feedback messages */
.error-text {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 5px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #c3e6cb;
  border-radius: 0.25rem;
}
.actions {
  display: flex;
  justify-content: center; /* Center buttons horizontally */
  gap: 10px;
  width: 100%;
  margin-top: auto; /* Push to the bottom of the container */
  padding-top: 10px;
  grid-column: span 2;
}

.actions .btn {
  padding: 12px 20px;
  border-radius: 6px;
  font-weight: 600;
}

.btn-primary,
.btn-secondary,
.btn-danger{
  flex: 1;
  padding: 12px 20px;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.5s;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
  border: none;
}


.btn-secondary:hover {
  background: #7f8c8d;
}

.feedback .error-text {
  color: red;
  font-size: 0.9rem;
}

.feedback .success-text {
  color: green;
  font-size: 1rem;
}

  .btn-danger {
    background-image: linear-gradient(to right, #e52d27 0%, darkred  51%, #e52d27  100%);
    transition: 0.5s;
    background-size: 200% auto;
  }

.btn-danger:hover {
  background-position: right center;
}


/* Responsiveness */
@media (max-width: 768px) {
  .signup-card {
    overflow: visible; /* Allow content to grow outside */
    max-height: none; /* Remove any maximum height restrictions */
  }

  .schedule-row {
    flex-wrap: wrap;
    gap: 10px; /* Add spacing between wrapped items */
  }

  .schedule-day {
    flex-basis: 100%; /* Make the day label take full width */
    text-align: center; /* Center-align the day label */
    margin-bottom: 5px; /* Add spacing below day labels */
  }

  .time-fields {
    flex-basis: 100%; /* Make the time fields stack on smaller screens */
    justify-content: space-between;
    gap: 5px;
  }

  .time-input {
    flex-grow: 1; /* Allow inputs to stretch evenly */
    max-width: 48%; /* Ensure inputs remain usable and do not shrink too much */
  }

  .schedule-container {
    padding: 10px; /* Reduce padding for smaller screens */
  }

  .container h1 {
    font-size: 1.5rem; /* Reduce font size for small screens */
    margin-bottom: 10px; /* Add spacing below the title */
  }

  .signup-card {
    width: 100%; /* Make the form take full width */
    padding: 15px; /* Reduce padding for smaller screens */
  }

}

.form-group {
  margin-bottom: 1.5rem;
}

button {
  margin: 0.5rem 0;
}
</style>
