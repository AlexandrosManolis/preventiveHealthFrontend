<script setup>
import { onMounted, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Swal from 'sweetalert2'

const backendEnvVar = import.meta.env.VITE_BACKEND
const urlRef = ref(`${backendEnvVar}/api/admin/pendingRequests`)
const authRef = ref(true)

const { data, performRequest } = useRemoteData(urlRef, authRef)

onMounted(() => {
  performRequest()
})

const accept = (resultId) => {
  Swal.fire({
    title: 'Confirm request acceptance',
    showCloseButton: true,
    confirmButtonText: 'Submit',
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      try {
        urlRef.value = `${backendEnvVar}/api/admin/pendingRequests/${resultId}/accept`
        const methodRef = ref('POST')

        const { performRequest } = useRemoteData(urlRef, authRef, methodRef)
        const response = await performRequest()

        if (typeof response === 'object') {
          return response
        }
        if (!response.ok) {
          return Swal.showValidationMessage(`${JSON.stringify(await response.json())}`)
        }
        return response.json()
      } catch (error) {
        Swal.showValidationMessage(`Request failed: ${error}`)
      }
    },
    allowOutsideClick: () => !Swal.isLoading(),
  })
    .then((result) => {
      if (result.isConfirmed) {
        return Swal.fire({
          title: 'Appointment accepted successfully',
          icon: 'success',
        })
      }
    })
    .then(() => {
      window.location.reload()
    })
}
const reject = (resultId) => {
  Swal.fire({
    title: 'Confirm rejection',
    input: 'text',
    inputAttributes: {
      autocapitalize: 'off',
    },
    inputValidator: (value) => {
      if (!value) {
        return 'You need to write something!'
      }
    },
    showCloseButton: true,
    confirmButtonText: 'Confirm',
    showLoaderOnConfirm: true,
    preConfirm: async (causeOfRejection) =>{
      try{
        urlRef.value = `${backendEnvVar}/api/admin/pendingRequests/${resultId}/reject`
        const methodRef = ref('POST')

        const bodyRef = ref(causeOfRejection.trim());

        const { performRequest } = useRemoteData(urlRef, authRef, methodRef, bodyRef)
        const response = await performRequest();
        if (typeof response === "object") {
          return response;
        }
        if (!response.ok) {
          return Swal.showValidationMessage(`${JSON.stringify(await response.json())}`);
        }
        return response.json();
      }catch (err){
        Swal.showValidationMessage(`Request failed: ${err}`);
      }
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result)=>{
    if(result.isConfirmed){
      return Swal.fire({
        title: "User register request rejected",
        icon: "success"
      });
    }
  }).then(()=>{
    window.location.reload();
  })
}
</script>

<template>
  <div v-if="data" class="results-container">
    <h1 style="text-align: center; margin-bottom: 10px">Pending Register Requests</h1>
    <table class="results-table">
      <thead>
        <tr>
          <th>Id</th>
          <th>Status</th>
          <th>User's Full Name</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="result in data" :key="result.id">
          <td>{{ result.id }}</td>
          <td>
            {{ result.status }}
          </td>
          <td>
            {{ result.fullName }}
          </td>
          <td>
            <RouterLink
              :to="{ name: 'userProfile', params: { id: result.requestedUserId } }"
              class="btn btn-primary"
            >
              View Details
            </RouterLink>
            <button
              class="btn btn-success"
              @click="accept(result.id)"
              style="margin-left: 10px; margin-right: 10px"
            >
              Accept
            </button>
            <button class="btn btn-danger" @click="reject(result.id)">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else>
    <h1 style="text-align: center; margin-top: 60px">No requests found</h1>
  </div>
</template>

<style scoped>
.results-container {
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  width: 100vh;
  padding: 16px;
  margin: 20px auto;
  font-family: 'Inter', sans-serif;
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.results-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 500;
  color: #9fa2b4;
  font-size: 14px;
  border-bottom: 1px solid #dfe0eb;
}

.results-table td {
  padding: 16px;
  border-bottom: 1px solid #dfe0eb;
  color: #252733;
  font-size: 14px;
}

.results-table tr:last-child td {
  border-bottom: none;
}

.results-table tr.selected {
  background-color: rgba(55, 81, 255, 0.05);
}

.results-table tr:hover {
  background-color: rgba(55, 81, 255, 0.02);
}

.btn {
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-success {
  background-color: #00b87c;
  color: white;
}

.btn-danger {
  background-color: #f64e60;
  color: white;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Responsive styles */
@media (max-width: 1024px) {
  .results-container {
    margin-top: 60px;
    width: auto;
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .results-container {
    padding: 12px;
    width: 100%;
    margin-top: 60px;
    border-radius: 0;
    box-shadow: none;
  }

  .results-table {
    display: block;
  }

  .results-table thead {
    display: none;
  }

  .results-table tbody,
  .results-table tr,
  .results-table td {
    display: block;
    width: 100%;
  }

  .results-table tr {
    margin-bottom: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    background-color: white;
    padding: 8px;
  }

  .results-table td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    position: relative;
  }

  .results-table td:before {
    content: attr(data-label);
    font-weight: 500;
    color: #9fa2b4;
    display: block;
    margin-bottom: 4px;
  }

  .results-table td:last-child {
    border-bottom: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    width: 100%;
    margin: 4px 0 !important;
    padding: 10px;
    text-align: center;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .results-container {
    padding: 8px;
  }

  .results-table tr {
    padding: 12px 8px;
  }

  .results-table td {
    padding: 6px 8px;
  }
}
</style>
