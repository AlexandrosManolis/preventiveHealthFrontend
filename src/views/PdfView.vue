<script setup>
import PDF from 'pdf-vue3'
import { onMounted, ref } from 'vue'
import { useRemoteData } from '@/composables/useRemoteData.js'
import Swal from 'sweetalert2'
import { useRoute } from 'vue-router'

// PDF viewer references
const pdfViewerOpen = ref(false);
const pdfData = ref(null);
const loadingPdf = ref(false);
const totalPages = ref(0);

const route = useRoute()

const backendEnvVar = import.meta.env.VITE_BACKEND
const userIdRef = ref(route.params.id)

const props = defineProps({
  appointment_id: {
    required: true
  }
});

const previewFile = async () => {
  loadingPdf.value = true;
  pdfViewerOpen.value = true;

  const authRef = ref(true);
  const urlRef = ref(`${backendEnvVar}/api/medicalRecord/${userIdRef.value}/appointments/${props.appointment_id}/details/examFile`);
  const { performRequest } = useRemoteData(urlRef, authRef);

  try {
    const response = await performRequest();

    let pdfBlob;
    if (response instanceof Blob) {
      pdfBlob = response;
    } else if (response instanceof ArrayBuffer) {
      pdfBlob = new Blob([response], { type: 'application/pdf' });
    } else if (Array.isArray(response)) {
      // If it's an array (like Uint8Array or byte array)
      pdfBlob = new Blob([new Uint8Array(response)], { type: 'application/pdf' });
    } else {
      throw new Error("Invalid response format");
    }

    const reader = new FileReader();
    reader.readAsDataURL(pdfBlob);

    reader.onload = () => {
      pdfData.value = reader.result;
      loadingPdf.value = false;
    };

    reader.onerror = (error) => {
      console.error("Error reading PDF blob:", error);
      loadingPdf.value = false;
      pdfViewerOpen.value = false;
      Swal.fire({
        title: "Error loading document",
        text: "Could not process the PDF file",
        icon: "error"
      });
    };
  } catch (error) {
    console.error("Error loading PDF:", error);
    loadingPdf.value = false;
    pdfViewerOpen.value = false;
    Swal.fire({
      title: "Error loading document",
      text: "Could not load the PDF document",
      icon: "error"
    });
  }
};

// Handle load success
const handleLoadSuccess = (numberOfPages) => {
  totalPages.value = numberOfPages;
};

const closePdfViewer = () => {
  pdfViewerOpen.value = false;
  pdfData.value = null;
};

const disableContextMenu = (event) => {
  event.preventDefault();
  return false;
};

onMounted(() => {
  previewFile();
});
</script>

<template>
  <div v-if="pdfViewerOpen" class="pdf-viewer-modal" @contextmenu="disableContextMenu">
    <div class="pdf-viewer-container">
      <div class="pdf-viewer-header">
        <h3>PDF Document</h3>
        <button @click="closePdfViewer" class="close-button" aria-label="Close">
          <span>&times;</span>
        </button>
      </div>

      <div class="pdf-viewer-content" @contextmenu="disableContextMenu">
        <div v-if="loadingPdf" class="pdf-loading">
          <div class="spinner"></div>
          <p>Loading PDF...</p>
        </div>

        <div v-else class="pdf-content-wrapper" @contextmenu="disableContextMenu">
          <div v-if="pdfData" class="pdf-document-container">
            <PDF :src="pdfData" @loadSuccess="handleLoadSuccess" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pdf-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  user-select: none;
  backdrop-filter: blur(3px);
}

.pdf-viewer-container {
  background-color: white;
  width: 50%;
  height: 90%;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.pdf-viewer-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.pdf-viewer-header h3 {
  font-size: 18px;
  margin: 0;
  color: #333;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: color 0.2s;
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.close-button:hover {
  color: #e53935;
  background-color: rgba(0, 0, 0, 0.05);
}

.pdf-viewer-content {
  max-height: calc(90vh - 60px);
  overflow-y: auto;
  flex: 1;
  background-color: #f0f2f5;
}

.pdf-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 300px;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.pdf-content-wrapper {
  height: 100%;
  width: 100%;
}

.pdf-document-container {
  height: 100%;
  padding: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .pdf-viewer-container{
    width: max-content;
    height: max-content;
  }
}
</style>
