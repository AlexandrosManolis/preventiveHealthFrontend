<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRemoteData } from '../composables/useRemoteData';
import { RouterLink } from 'vue-router'
import Swal from 'sweetalert2'

// API setup
const backendEnvVar = import.meta.env.VITE_BACKEND;
const urlRef = ref(`${backendEnvVar}/api/admin`);
const authRef = ref(true);
const { data, isLoading, error, performRequest } = useRemoteData(urlRef, authRef);

// State
const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const selectedUsers = ref([]);
const currentPage = ref(1);
const perPage = ref(10);

// Reset page when filters change
watch([searchQuery, roleFilter, statusFilter], () => {
  currentPage.value = 1;
});

const filteredUsers = computed(() => {
  if (!data.value || !Array.isArray(data.value)) return [];

  return data.value.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Role filtering: match the role from the dropdown with the user's role
    const matchesRole = roleFilter.value === '' || user.roles[0].roleName === roleFilter.value;

    return matchesSearch && matchesRole;
  }).slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value);
});

const refreshData = () => {
  performRequest();
};

const clearFilters = () => {
  searchQuery.value = '';
  roleFilter.value = '';
  statusFilter.value = '';
  currentPage.value = 1;
};

const deleteUser = (userId) => {
  Swal.fire({
    title: "Are you sure you want to remove user?",
    showCancelButton: true,
    confirmButtonText: "Submit",
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      try {
        urlRef.value = `${backendEnvVar}/api/admin/remove/${userId}`;
        const methodRef = ref("DELETE");

        const { performRequest } = useRemoteData(urlRef, authRef, methodRef);
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
        title: "User removed successfully",
        icon: "success"
      });
    }
  }).then(() => {
    window.location.reload();
  });
};

// Lifecycle hooks
onMounted(() => {
  performRequest();
});
</script>

<template>
  <div class="user-list-container">
    <div class="user-list-header">
      <h2 class="user-list-title">Users</h2>
      <div class="user-list-actions">
        <div class="search-container">
          <input type="text" v-model="searchQuery" placeholder="Search users..." class="search-input" />
          <button class="search-btn">
            <i class="bi bi-search"></i>
          </button>
        </div>
        <div class="dropdown">
          <button class="add-user-btn dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-plus-circle"></i> Add User
          </button>
          <ul class="dropdown-menu" aria-labelledby="registerDropdown" style="text-align: center">
            <li class="dropdown-item">
              <RouterLink :to="{ name: 'patientSignup', query: { userType: 'patient' } }" class="btn btn-secondary">Patient</RouterLink>
            </li>
            <li class="dropdown-item">
              <RouterLink :to="{ name: 'doctorSignup', query: { userType: 'doctor' } }" class="btn btn-secondary">Doctor</RouterLink>
            </li>
            <li class="dropdown-item">
              <RouterLink :to="{ name: 'diagnosticSignup', query: { userType: 'diagnostic' } }" class="btn btn-secondary">Diagnostic Center</RouterLink>
            </li>
          </ul>
        </div>

      </div>
    </div>

    <div class="user-list-filters">
      <div class="filter-item">
        <select v-model="roleFilter" class="filter-select">
          <option value="">All Roles</option>
          <option value="ROLE_ADMIN">Admin</option>
          <option value="ROLE_PATIENT">Patient</option>
          <option value="ROLE_DIAGNOSTIC">Diagnostic Center</option>
          <option value="ROLE_DOCTOR">Doctor</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="refreshData" class="refresh-btn">Try Again</button>
    </div>

    <div v-else-if="!filteredUsers.length" class="empty-state">
      <i class="fas fa-users-slash empty-icon"></i>
      <p>No users found matching your filters</p>
      <button @click="clearFilters" class="clear-filters-btn">Clear Filters</button>
    </div>

    <div v-else class="user-list-content">
      <table class="user-table">
        <thead>
        <tr>
          <th>User</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="user in filteredUsers" :key="user.id" :class="{ 'selected': selectedUsers.includes(user.id) }">
          <td class="user-info">
            <div class="user-details">
              <div class="user-name">{{ user.username }}</div>
              <div class="user-email">{{ user.email }}</div>
            </div>
          </td>
          <td>
            <span v-if="user.roles && user.roles.length > 0" class="role-badge" :class="user.roles[0].roleName">
              {{ user.roles[0].roleName.replace('ROLE_', '') }}
            </span>
            <span v-else class="role-badge default">N/A</span>
          </td>

          <td>
            <div class="action-buttons">
              <RouterLink :to="{name : 'userProfile', params: {id: user.id}}" class="action-btn edit-btn">
                <i class="bi bi-pencil-fill"></i>
              </RouterLink>
              <button class="action-btn delete-btn" @click="deleteUser(user.id)">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
      <div style="display: flex; gap: 10px">
        <RouterLink :to="{name: 'pendingRegisterRequests'}" class="btn btn-secondary" style="margin-top: 10px">Pending Register Requests</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-list-container {
  background-color: transparent;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  width: 100vh;
  padding: 24px;
  margin: 60px 0;
  font-family: 'Inter', sans-serif;
}

.user-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.user-list-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #252733;
  margin: 0;
}

.user-list-actions {
  display: flex;
  gap: 12px;
}

.search-container {
  position: relative;
  width: 240px;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 40px;
  border: 1px solid #dfe0eb;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3751ff;
}

.search-btn {
  position: absolute;
  left: 12px;
  top: 10px;
  background: none;
  border: none;
  color: #9fa2b4;
}

.add-user-btn {
  background-color: #3751ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-user-btn:hover{
  background-color: #2a3fd0;
}

.user-list-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #dfe0eb;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
  min-width: 120px;
}

.user-list-content {
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.user-table th {
  text-align: left;
  padding: 12px 16px;
  font-weight: 500;
  color: #9fa2b4;
  font-size: 14px;
  border-bottom: 1px solid #dfe0eb;
}

.user-table td {
  padding: 16px;
  border-bottom: 1px solid #dfe0eb;
  color: #252733;
  font-size: 14px;
}

.user-table tr:last-child td {
  border-bottom: none;
}

.user-table tr.selected {
  background-color: rgba(55, 81, 255, 0.05);
}

.user-table tr:hover {
  background-color: rgba(55, 81, 255, 0.02);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.user-email {
  color: #9fa2b4;
  font-size: 12px;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.role-badge.ROLE_ADMIN {
  background-color: #ff4757;
  color: white;
}

.role-badge.ROLE_PATIENT {
  background-color: #2ed573;
  color: white;
}

.role-badge.ROLE_DOCTOR {
  background-color: #1e90ff;
  color: white;
}

.role-badge.ROLE_DIAGNOSTIC {
  background-color: #2a3fd0;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f8f8fb;
}

.edit-btn {
  color: #3751ff;
}

.delete-btn {
  color: #ff4757;
}

/* Loading state */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9fa2b4;
}

.loading-spinner {
  border: 3px solid rgba(55, 81, 255, 0.1);
  border-top: 3px solid #3751ff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error state */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #ff4757;
}

.refresh-btn {
  margin-top: 16px;
  background-color: #3751ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9fa2b4;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.clear-filters-btn {
  margin-top: 16px;
  background-color: transparent;
  color: #3751ff;
  border: 1px solid #3751ff;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

/* Responsive styles */
@media (max-width: 1024px) {
  .user-list-container{
    margin-top: 60px;
    width: auto;
  }

  .user-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .user-list-actions {
    width: 100%;
  }

  .search-container {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .user-list-filters {
    flex-wrap: wrap;
  }

  .filter-item {
    flex: 1;
    min-width: 120px;
  }

  .user-table th:nth-child(4),
  .user-table td:nth-child(4) {
    display: none;
  }
}

@media (max-width: 480px) {
  .user-table th:nth-child(5),
  .user-table td:nth-child(5) {
    display: none;
  }
}
</style>
