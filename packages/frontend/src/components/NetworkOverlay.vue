<template>
    <q-dialog :model-value="!isOnline" persistent maximized>
        <q-card class="flex flex-center column justify-center" style="height: 100%">
            <div class="text-h6 q-mb-md">
                <FTCenteredText>
                    <q-spinner color="primary" /> No Internet Connection
                </FTCenteredText>
            </div>
            <p class="text-subtitle1">Wait or try to reload the page</p>
            <p>
                <q-btn rounded class="button-gradient" @click="refreshApp">Reload</q-btn>
            </p>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { useNetworkStatus } from "src/composables/useNetworkStatus";
import FTCenteredText from "src/components/FTCenteredText.vue";
import { refreshApp } from "src/helpers/utils";

const { isOnline } = useNetworkStatus();
</script>
