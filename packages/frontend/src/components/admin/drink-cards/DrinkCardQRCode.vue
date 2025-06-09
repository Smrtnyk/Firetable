<script setup lang="ts">
import { toDataURL } from "qrcode";
import { AppLogger } from "src/logger/FTLogger";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    url: string;
}

const props = defineProps<Props>();
const { t } = useI18n();
const qrCodeDataUrl = ref("");

function downloadQRCode(): void {
    const link = document.createElement("a");
    link.download = `drink-card-qr.png`;
    link.href = qrCodeDataUrl.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function generateQRCode(): Promise<void> {
    try {
        qrCodeDataUrl.value = await toDataURL(props.url, {
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
            errorCorrectionLevel: "H",
            margin: 2,
            width: 512,
        });
    } catch (err) {
        AppLogger.error("Failed to generate QR code:", err);
    }
}

onMounted(generateQRCode);
</script>

<template>
    <div class="drink-card-qr-code">
        <img
            v-if="qrCodeDataUrl"
            :src="qrCodeDataUrl"
            :alt="t('PageAdminPropertyDrinkCards.qrCodeAlt')"
            class="mb-4"
        />
        <v-btn
            rounded="lg"
            color="primary"
            prepend-icon="fas fa-download"
            @click="downloadQRCode"
            size="large"
        >
            {{ t("PageAdminPropertyDrinkCards.downloadQRCode") }}
        </v-btn>
    </div>
</template>

<style lang="scss" scoped>
.drink-card-qr-code {
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
        width: 256px;
        height: 256px;
    }
}
</style>
