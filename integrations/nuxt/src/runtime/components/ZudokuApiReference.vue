<template>
  <div ref="container" :data-api-url="specUrl" :data-logo-url="logoUrl" style="min-height: 100vh" />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ZudokuApiReferenceConfiguration } from '@zudoku/core'
import { getCdnUrl } from '@zudoku/core'

const props = defineProps<{
  configuration: ZudokuApiReferenceConfiguration
}>()

const container = ref<HTMLDivElement | null>(null)

const specUrl = computed(() => props.configuration.spec?.url ?? '')
const logoUrl = computed(() => {
  if (!props.configuration.logo) return ''
  return typeof props.configuration.logo.src === 'string'
    ? props.configuration.logo.src
    : props.configuration.logo.src.light
})

onMounted(() => {
  const cdnUrls = getCdnUrl()

  // Load CSS
  if (!document.querySelector(`link[href="${cdnUrls.style}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cdnUrls.style
    document.head.appendChild(link)
  }

  // Load script
  if (!document.querySelector(`script[src="${cdnUrls.script}"]`)) {
    const script = document.createElement('script')
    script.type = 'module'
    script.src = cdnUrls.script
    document.body.appendChild(script)
  }
})
</script>
