<script setup>
import { ref, onMounted, watch } from 'vue'
import { GChart } from 'vue-google-charts'
import { useRemoteData } from '@/composables/useRemoteData.js'
import { useRoute } from 'vue-router'

// Setup data and state
const route = useRoute();
const currentYear = ref(new Date().getFullYear())
const chartData = ref([['Month', 'Total Appointments', 'Completed Appointments']])

const backendEnvVar = import.meta.env.VITE_BACKEND

const userIdRef = ref(route.params.id)
const urlRef = ref(`${backendEnvVar}/api/appointment/${userIdRef.value}/allAppointments`);
const authRef = ref(true);
const {data, performRequest} = useRemoteData(urlRef, authRef);
const chartLoaded = ref(false);

const chartOptions = {
  hAxis: {
    title: 'Number of Appointments',
    textStyle: { fontSize: 11 }
  },
  vAxis: {
    title: 'Month',
    textStyle: { fontSize: 11 }
  },
  legend: {
    position: 'top',
    textStyle: { fontSize: 11 }
  },
  bars: 'grouped',
  colors: ['#4285F4', '#34A853'],
  animation: { startup: true, duration: 500, easing: 'out' },
  chartArea: { width: '75%', height: '75%' },
  fontSize: 11
}

// Process appointment data for the chart
const processAppointments = () => {
  if (!data.value) return

  const monthStats = {}

  // Collect data for current year
  data.value.forEach(appointment => {
    const date = new Date(appointment.date)
    if (date.getFullYear() !== currentYear.value) return

    const monthKey = date.getMonth()
    if (!monthStats[monthKey]) monthStats[monthKey] = { total: 0, completed: 0 }

    monthStats[monthKey].total += 1
    if (appointment.appointmentStatus === 'COMPLETED') {
      monthStats[monthKey].completed += 1
    }
  })

  // Create chart rows for all months
  const chartRows = Array.from({ length: 12 }, (_, month) => {
    const monthName = new Date(currentYear.value, month).toLocaleString('default', { month: 'short' })
    const stats = monthStats[month] || { total: 0, completed: 0 }
    return [monthName, stats.total, stats.completed]
  })

  chartData.value = [['Month', 'Total Appointment Requests', 'Completed Appointments'], ...chartRows]
  chartLoaded.value = true;
}

// Year navigation
const changeYear = direction => {
  currentYear.value += direction
  processAppointments()
}

watch(data, processAppointments)

const ratingValue = ref(null);

const ratingAvg = (async ()=>{
  urlRef.value = `${backendEnvVar}/api/user/specialist/${userIdRef.value}/rating`;
  const {performRequest} = useRemoteData(urlRef, authRef);

  try {
    const response = await performRequest();

    if (response === null || response === undefined) {
      throw new Error("No data received from the backend.");
    }

    ratingValue.value = response;
  } catch (error) {
    console.error("Error fetching rating:", error);
  }
});

onMounted(()=>{
  performRequest();
  ratingAvg();
});
</script>

<template>
  <div>
    <p class="doctor-score-display" v-if="ratingValue">
      <b style="display: flex; flex-direction: row;">
        <span style="margin-right: 10px">Your Rating:</span>
        <span v-for="star in 5" :key="'display-'+star" class="display-star" style="margin-left: 2px; margin-right: 2px">
        <i class="bi" :class="[star <= ratingValue.averageSpecialistRating ? 'bi-star-fill' : 'bi-star']"></i>
      </span>
        <span class="score-value" style="margin-left: 10px"><b>{{ ratingValue.averageSpecialistRating }}/5</b></span>
      </b>
      <RouterLink :to="{name: 'allRatings', params: {id: userIdRef}}" class="btn btn-light" style="margin-left: 10px; background: transparent;">All Ratings</RouterLink>
    </p>

    <div class="chart-container">
      <div class="chart-header" style="justify-items: center">
        <h2>Appointments Statistics</h2>
        <div class="year-selector">
          <button class="year-btn" @click="changeYear(-1)" aria-label="Previous year">
            <span class="arrow">←</span>
          </button>
          <div class="year-display">{{ currentYear }}</div>
          <button class="year-btn" @click="changeYear(1)" aria-label="Next year">
            <span class="arrow">→</span>
          </button>
        </div>
      </div>

      <div class="chart-wrapper">
        <GChart v-if="chartLoaded" :type="'BarChart'" :data="chartData" :options="chartOptions" :resizeDebounce="200" class="g-chart"/>
        <div v-else class="loading">Loading chart data...</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.doctor-score-display {
  display: flex;
  flex-direction: row;
  font-size: x-large;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 0 10px;
  margin-top: 60px;
}

.chart-container {
  background-color: transparent;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  margin: 2rem auto;
  width: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

h2 {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: #2d3748;
  font-weight: 700;
  text-align: center;
}

.year-selector {
  display: flex;
  align-items: center;
  background-color: transparent;
  padding: 4px;
  margin-bottom: 1.5rem;
}

.year-btn {
  width: 40px;
  height: 40px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.3s ease;
  display: grid;
  place-items: center;
}

.year-btn:hover {
  background-color: #e2e8f0;
  color: #3182ce;
}

.year-btn:active {
  transform: scale(0.95);
}

.year-display {
  margin: 0 12px;
  font-weight: 600;
  font-size: 1.125rem;
  color: #1a202c;
  text-align: center;
}

.chart-wrapper {
  width: 100%;
  height: min(60vh, 500px);
}

.g-chart {
  width: 100%;
  height: 100% !important;
}

@media (max-width: 768px) {
  .doctor-score-display {
    font-size: large;
    width: auto;
    margin-top: 60px;
  }

  .chart-container {
    padding: 16px;
    border-radius: 12px;
    width: 100%;
  }

  h2 {
    font-size: 1.5rem;
  }

  .year-btn {
    width: 36px;
    height: 36px;
  }
  .g-chart{
    width: 100% !important;
  }
}
</style>
