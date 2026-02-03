<template>
  <ZudokuApiReference :configuration="configuration" />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import ZudokuApiReference from '../components/ZudokuApiReference.vue'

const route = useRoute()
const configuration = route.meta.configuration
</script>
