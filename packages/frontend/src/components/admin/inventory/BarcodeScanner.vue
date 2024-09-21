<template>
    <div>
        <video ref="video" style="width: 100%"></video>
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted } from "vue";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AppLogger } from "src/logger/FTLogger";
import { matchesProperty } from "es-toolkit/compat";
import { noop } from "es-toolkit";

const video = ref<HTMLVideoElement | null>(null);
const codeReader = new BrowserMultiFormatReader();
const emit = defineEmits<(e: "barcodeScanned", barcode: string) => void>();
let stop = noop;

async function getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(matchesProperty("kind", "videoinput"));
}

async function selectHighestResolutionCamera(): Promise<string | undefined> {
    const videoDevices = await getVideoInputDevices();
    let selectedDeviceId: string | undefined;
    let highestResolution = 0;
    const backCameras = videoDevices.filter(function (device) {
        return device.label.toLowerCase().includes("back");
    });

    for (const device of backCameras) {
        const tempConstraints = {
            video: {
                deviceId: device.deviceId,
                // Request the highest possible width
                width: { ideal: 9999 },
                // Request the highest possible height
                height: { ideal: 9999 },
            },
        };

        try {
            // eslint-disable-next-line no-await-in-loop -- fine here
            const stream = await navigator.mediaDevices.getUserMedia(tempConstraints);
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            const resolution = (settings.width ?? 0) * (settings.height ?? 0);

            if (resolution > highestResolution) {
                highestResolution = resolution;
                selectedDeviceId = device.deviceId;
            }

            // Stop the track after getting settings
            track.stop();
        } catch (error) {
            AppLogger.error("Error accessing camera:", error);
        }
    }

    return selectedDeviceId;
}

async function startScanning(): Promise<void> {
    if (!video.value) {
        return;
    }

    const selectedDeviceId = await selectHighestResolutionCamera();

    if (!selectedDeviceId) {
        AppLogger.error("No suitable camera found.");
        return;
    }

    const constraints = {
        video: {
            deviceId: { exact: selectedDeviceId },
        },
    };

    try {
        const res = await codeReader.decodeFromConstraints(
            constraints,
            video.value,
            function (result, err) {
                if (result) {
                    emit("barcodeScanned", result.getText());

                    res.stop();
                } else if (err) {
                    AppLogger.errorAndAddToBody("Barcode scan error:", err);
                }
            },
        );
        stop = res.stop.bind(res);
    } catch (error) {
        AppLogger.error("Error accessing camera:", error);
    }
}

onMounted(startScanning);
onBeforeUnmount(stop);
</script>
