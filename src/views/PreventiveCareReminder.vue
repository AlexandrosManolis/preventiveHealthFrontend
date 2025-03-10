<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useRemoteData } from '@/composables/useRemoteData.js'
import ReminderForm from '@/views/ReminderForm.vue'

const route = useRoute()
const userIdRef = ref(route.params.id)

const backendEnvVar = import.meta.env.VITE_BACKEND

const urlRef = ref(`${backendEnvVar}/api/reminder/form/${userIdRef.value}/exists`)
const authRef = ref(true)

const { data, performRequest } = useRemoteData(urlRef, authRef)

onMounted(() => {
  performRequest()
})
</script>

<template>
  <div v-if="data">
    <div>
      <span style="margin-top: 100px">{{ data }}</span>
    </div>
  </div>
  <div v-else>
    <ReminderForm/>
  </div>
</template>

<style scoped></style>
