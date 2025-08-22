<script setup>
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'

const router = useRouter()
const route = useRoute()

const userIdRef = ref(route.params.id)

const backendEnvVar = import.meta.env.VITE_BACKEND

const urlRef = ref(`${backendEnvVar}/api/user/specialist/${userIdRef.value}/allRatings`)
const authRef = ref(false)

const {performRequest, data} = useRemoteData(urlRef, authRef)

onMounted(()=>{
  performRequest();
})

const goBack = (()=>{
  router.back(-1);
})
</script>

<template>
  <div class="container-fluid">
    <div v-if="data && data.length > 0">
      <h2 class="text-center">{{data[0].diagnosticFullName || data[0].doctorFullName}}</h2>
      <p class="text-center">{{data[0].diagnosticAddress || data[0].doctorAddress}}</p>
      <div v-for="data in data" :key="data.id" style="padding: 10px">
        <div class="card">
          <div class="card-header" style="display: flex; flex-direction: row; justify-content: space-between">
            {{data.patientFullName}}
            <div>
              <b>Rating:</b> {{data.rating}} / 5
            </div>
          </div>
          <div class="card-body"><b>Description:</b> {{data.ratingDescription}}</div>
        </div>
      </div>
    </div>

    <div v-else>
      <h1><strong>No ratings found!</strong></h1>
    </div>
    <button class="btn btn-secondary" @click="goBack()">Back</button>
  </div>
</template>

<style scoped>
.card{
  background: none;
  transition: transform 0.2s, box-shadow 0.2s;
  width: 100%;
}

.card-header{
  background: #335c81 45%;
  color: white;
}

.card:hover{
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.container-fluid{
  margin-top: 60px;
  display: flex;
  flex-direction:column;
  align-content: center;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .container-fluid{
    margin-top: 80px;
  }
}
</style>
