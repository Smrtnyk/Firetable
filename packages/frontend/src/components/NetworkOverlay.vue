<template>
    <q-dialog :model-value="!isOnline" persistent maximized>
        <q-card class="flex flex-center column justify-center" style="height: 100%">
            <div class="text-h6 q-mb-md">
                <FTCenteredText>
                    <q-spinner color="primary" /> {{ t('NetworkOverlay.noInternetConnectionText') }}
                </FTCenteredText>
            </div>
            <p class="text-subtitle1">{{ t('NetworkOverlay.waitOrReloadText') }}</p>
            <p>
                <q-btn rounded class="button-gradient" @click="refreshApp">{{ t('NetworkOverlay.reloadButtonLabel') }}</q-btn>
            </p>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useNetworkStatus } from "src/composables/useNetworkStatus";
import { refreshApp } from "src/helpers/utils";
import { useI18n } from "vue-i18n";

const { isOnline } = useNetworkStatus();
const { t } = useI18n();
</script>
