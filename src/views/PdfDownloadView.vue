<script setup>
import { computed, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Swal from 'sweetalert2'
import { useRoute } from 'vue-router'
import { useApplicationStore } from '@/stores/application.js'

const route = useRoute()
const applicationStore = useApplicationStore()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)

const props = defineProps({
  id: {
    required: true
  }
});

const userRole = computed(() =>
  applicationStore.isAuthenticated ? applicationStore.userData.roles : []
)

const downloadFile = async () => {
  const authRef = ref(true);
  const requestUrlRef = ref(`${backendEnvVar}/api/medicalRecord/${userIdRef.value}/requestDownload/${props.id}`);

  try {
    const { performRequest } = useRemoteData(requestUrlRef, authRef);
    await performRequest();

    Swal.fire({
      title: "Enter token",
      text: "Please check your email for the verification token",
      input: "text",
      inputAttributes: {
        autocapitalize: "off"
      },
      inputValidator: (value) => {
        if (!value) {
          return "You need to enter the token!";
        }
      },
      confirmButtonText: "Submit",
      showLoaderOnConfirm: true,
      preConfirm: async (token) => {
        try {
          const urlRef = ref(`${backendEnvVar}/api/medicalRecord/${userIdRef.value}/verifyDownload/${props.id}`);
          const methodRef = ref("POST");
          const bodyRef = ref(token.trim());

          const { performRequest } = useRemoteData(urlRef, authRef, methodRef, bodyRef);

          const response = await performRequest();
          console.log(response)
          if (response instanceof Blob) {
            return response;
          } else if (typeof response === 'string') {
            throw new Error(response);
          } else {
            throw new Error("Invalid response, expected a PDF file.");
          }
        } catch (error) {
          Swal.showValidationMessage(`Verification failed: ${error.message || "An error occurred"}`);
        }
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const url = URL.createObjectURL(result.value);
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = 'medical-record.pdf'; // Set filename for download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setTimeout(() => URL.revokeObjectURL(url), 5000);
        Swal.fire({
          title: "Success!",
          text: "Token verified. File downloaded successfully.",
          icon: "success"
        });
      }
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: `Failed to request download: ${error.message || "An error occurred"}`,
      icon: "error"
    });
  }
};
</script>

<template>
  <button class="btn btn-secondary" style="margin-left: 10px">
    <span class="bi bi-file-earmark-arrow-down" @click="downloadFile" v-if="userRole.includes('ROLE_PATIENT')"> Download file</span>
  </button>
</template>

<style scoped>

</style>
