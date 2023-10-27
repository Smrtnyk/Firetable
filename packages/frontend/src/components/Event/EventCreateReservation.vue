<script setup lang="ts">
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";

interface State {
    guestName: string;
    numberOfGuests: number;
    guestContact: string;
    reservationNote: string;
    consumption: number;
}

const emit = defineEmits(["create"]);
const { t } = useI18n();
const state = reactive<State>({
    guestName: "",
    numberOfGuests: 2,
    guestContact: "",
    reservationNote: "",
    consumption: 1,
});
const reservationForm = ref<QForm | null>(null);

async function onOKClick() {
    if (!(await reservationForm.value?.validate())) return;
    emit("create", state);
}
</script>

<template>
    <q-card-section>
        <q-form ref="reservationForm" class="q-gutter-md q-pt-md q-pa-md">
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
