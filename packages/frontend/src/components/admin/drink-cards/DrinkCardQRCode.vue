<script setup lang="ts">
import { ref, onMounted } from "vue";
import { toDataURL } from "qrcode";
import { useI18n } from "vue-i18n";
import { AppLogger } from "src/logger/FTLogger";

interface Props {
    url: string;
}

const props = defineProps<Props>();
const { t } = useI18n();
const qrCodeDataUrl = ref("");

async function generateQRCode(): Promise<void> {
    try {
        qrCodeDataUrl.value = await toDataURL(props.url, {
            width: 512,
            margin: 2,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
            errorCorrectionLevel: "H",
        });
    } catch (err) {
        AppLogger.error("Failed to generate QR code:", err);
    }
}

function downloadQRCode(): void {
    const link = document.createElement("a");
    link.download = `drink-card-qr.png`;
    link.href = qrCodeDataUrl.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

onMounted(generateQRCode);
</script>

<template>
    <div class="DrinkCardQRCode">
        <img
            v-if="qrCodeDataUrl"
            :src="qrCodeDataUrl"
            :alt="t('PageAdminPropertyDrinkCards.qrCodeAlt')"
            class="q-mb-md"
        />
        <q-btn
            rounded
            color="primary"
            :label="t('PageAdminPropertyDrinkCards.downloadQRCode')"
            icon="download"
            @click="downloadQRCode"
        />
    </div>
</template>

<style lang="scss" scoped>
.DrinkCardQRCode {
    display: flex;
    flex-direction: column;
    align-items: center;

    img {
        width: 256px;
        height: 256px;
    }
}
</style>
