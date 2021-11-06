<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
    <div class="fixed-center text-center">
        <p class="text-faded">Sorry, nothing here...<strong>(404)</strong></p>
        <q-btn rounded class="button-gradient" style="width: 200px" @click="() => router.push('/')">
            Go back
        </q-btn>
    </div>
</template>
