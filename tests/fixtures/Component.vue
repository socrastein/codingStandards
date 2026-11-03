<script setup lang="ts">
// Fixture for the measuring test: a Vue component's <script setup>, with a callback named after the call it is passed to.
import { computed, ref } from "vue";

const names = ref<string[]>(["a", "bb"]);
const longest = computed(() => names.value.reduce((best, name) => (name.length > best.length ? name : best), ""));
</script>

<template>
  <p>{{ longest }}</p>
</template>
