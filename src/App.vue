<script setup>
import { RouterView } from 'vue-router'
import {onBeforeMount} from "vue";
import {useApplicationStore} from "@/stores/application.js";
import AppHeader from '@/components/AppHeader.vue'

const {loadUserData}= useApplicationStore();

onBeforeMount(() =>{
  loadUserData();
});

</script>

<template>
  <AppHeader/>
  <RouterView/>
</template>

<style scoped>
:global(body) {
  background-color: whitesmoke;
}

nav {
  width: 100%;
  font-size: 12px;
  margin-top: 2rem;
}

nav a {
  text-decoration: none;
  color: var(--color-text);
  font-size: 1rem;
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    padding-top: 2px;
    display: flex;
    padding-right: calc(var(--section-gap) / 2);
  }

  nav {
    text-align: left;
  }
}
</style>
