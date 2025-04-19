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
  font-family: 'Times New Roman', Times, serif;
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

:global(.btn-primary) {
  padding: 0.75rem;
  font-size: inherit;
  border: none;
  background:  linear-gradient(315deg, whitesmoke 0%, #335c81 45%);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

:global(.btn-primary:hover){
  background: linear-gradient(315deg, #007bff 0%,  #182b3a 80%);
  transform: scale(1.05);
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
