<script setup lang="ts">
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { CreateReservationPayload } from "@firetable/types";

const emit = defineEmits<{
    (e: "create", payload: CreateReservationPayload): void;
}>();
const { t } = useI18n();
const state = reactive<CreateReservationPayload>({
    guestName: "",
    numberOfGuests: 2,
    guestContact: "",
    reservationNote: "",
    consumption: 1,
    confirmed: false,
    time: "00:00",
});
const reservationForm = ref<QForm | null>(null);

async function onOKClick() {
    if (!(await reservationForm.value?.validate())) return;
    emit("create", state);
}
</script>

<template>
    <q-card-section>
        <q-form ref="reservationForm" class="q-gutter-md q-pt-md">
            <q-input
                v-model="state.guestName"
                rounded
                hide-bottom-space
                standout
                :label="t(`EventCreateReservation.reservationGuestName`)"
                lazy-rules="ondemand"
                :rules="[noEmptyString(), minLength('Name must be longer!', 2)]"
            />

            <q-input
                :model-value="state.time"
                rounded
                standout
                readonly
                :label="t(`EventCreateReservation.reservationTime`)"
            >
                <template #append>
                    <q-icon name="clock" class="cursor-pointer" />
                    <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-time v-model="state.time" format24h>
                            <div class="row items-center justify-end">
                                <q-btn
                                    :label="t('EventCreateForm.inputDateTimePickerCloseBtnLabel')"
                                    color="primary"
                                    flat
                                    v-close-popup
                                />
                            </div>
                        </q-time>
                    </q-popup-proxy>
                </template>
            </q-input>

            <q-input
                v-model="state.numberOfGuests"
                hide-bottom-space
                rounded
                standout
                type="number"
                :label="t(`EventCreateReservation.reservationNumberOfGuests`)"
                lazy-rules="ondemand"
                :rules="[requireNumber(), greaterThanZero()]"
            />

            <q-input
                v-model="state.consumption"
                hide-bottom-space
                rounded
                standout
                type="number"
                :label="t(`EventCreateReservation.reservationConsumption`)"
                lazy-rules="ondemand"
                :rules="[requireNumber(), greaterThanZero()]"
            />

            <q-input
                v-model="state.guestContact"
                rounded
                standout
                class="q-mb-md"
                :label="t(`EventCreateReservation.reservationGuestContact`)"
            />

            <q-input v-model="state.reservationNote" rounded standout label="Note" />

            <q-btn
                rounded
                size="md"
                class="button-gradient"
                @click="onOKClick"
                :label="t(`EventCreateReservation.reservationCreateBtn`)"
            />
        </q-form>
    </q-card-section>
</template>
