import { ref } from 'vue';
import { useApplicationStore } from '@/stores/application.js';
import extraOptions from 'jsdom/lib/jsdom/living/fetch/header-list.js'

const store = useApplicationStore();


export function useRemoteData(urlRef, authRef, methodRef = ref("GET"), bodyRef = ref(null),) {
  const data = ref(null);
  const error = ref(null);
  const loading = ref(false);

  const performRequest = () => {
    return new Promise((resolve, reject) => {
      loading.value = true;
      const headers = {
        'Content-Type': 'application/json',
        ...extraOptions.headers
      };

      if (authRef.value === true) {
        headers['Authorization'] = 'Bearer ' + store.userData.accessToken;
      }
      const config = {
        method: methodRef.value,
        headers: headers,
      };

      if (bodyRef.value !== null) {
        const isPlainObject = typeof bodyRef.value === 'object' && !Array.isArray(bodyRef.value);

        if (isPlainObject && 'medicalFile' in bodyRef.value && bodyRef.value.medicalFile instanceof File) {
          const formData = new FormData();
          Object.keys(bodyRef.value).forEach((key) => {
            if (key === "medicalFile" && bodyRef.value[key]) {
              formData.append(key, bodyRef.value[key]);
            } else if (bodyRef.value[key] !== null && bodyRef.value[key] !== undefined) {
              formData.append(key, bodyRef.value[key].toString());
            }
          });

          config.body = formData;
          delete headers["Content-Type"];
        } else {
          config.body = JSON.stringify(bodyRef.value);
          headers["Content-Type"] = "application/json";
        }
      }

      fetch(urlRef.value, config)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
          }

          const contentType = response.headers.get("Content-Type");

          // Handle different content types
          if (contentType?.includes("image/webp")) {
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            data.value = imageUrl;
            return imageUrl;
          } else if (contentType?.includes("application/pdf")) {
            const blob = await response.blob();
            data.value = blob;
            return blob;
          } else if (contentType?.includes("application/json")) {
            const json = await response.json();
            data.value = json;
            return json;
          } else {
            throw new Error("Unexpected response type: " + contentType);
          }
        })
        .then((responseData) => {
          console.log(responseData);
          data.value = responseData;
          resolve(responseData);
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          error.value = err;
          reject(err);
        })
        .finally(() => {
          loading.value = false;
        });
    });
  };

  return { data, error, loading, performRequest };
}
