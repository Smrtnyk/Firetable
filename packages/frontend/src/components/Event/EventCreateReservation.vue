<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { QForm } from "quasar";
import { greaterThanZero, minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";
import { Reservation, User } from "@firetable/types";

const socials = ["Whatsapp", "SMS", "Instagram", "Facebook", "Phone"].map((social, index) => {
    return {
        name: social,
        email: `social-${index}`,
    };
});

const props = defineProps<{
    users: User[];
    mode: "create" | "edit";
    reservationData?: Reservation; // Optional data for editing
}>();

const emit = defineEmits<{
    (e: "create" | "update", payload: Reservation): void;
}>();
const { t } = useI18n();

const initialState =
    props.mode === "edit" && props.reservationData
        ? props.reservationData
        : {
              guestName: "",
              numberOfGuests: 2,
              guestContact: "",
              reservationNote: "",
              consumption: 1,
              confirmed: false,
              time: "00:00",
              reservedBy: null as unknown as User,
          };
const state = reactive<Reservation>(initialState);
const reservationForm = ref<QForm | null>(null);
const formattedUsers = computed<Reservation["reservedBy"][]>(() =>
    props.users.map((user) => ({
        name: user.name,
        email: user.email,
    })),
);
const selectionType = ref("user");

const selectableOptions = computed(() => {
    return selectionType.value === "social" ? socials : formattedUsers.value;
});

const reservedByLabel = computed(() => {
    return selectionType.value === "social"
        ? t(`EventCreateReservation.reservedBySocialLabel`)
        : t(`EventCreateReservation.reservedByLabel`);
});

// Watcher that resets state.reservedBy when selectionType changes
watch(selectionType, (newVal) => {
    // When selectionType changes to 'social', reset reservedBy to the first social option
    // When changing to 'user', reset reservedBy to the first user option
    if (newVal === "social") {
        state.reservedBy = socials[0];
    } else {
        state.reservedBy = formattedUsers.value[0];
    }
});

function requireReservedBySelection(val: Reservation["reservedBy"]): boolean | string {
    return !!val?.email || t(`EventCreateReservation.requireReservedBySelectionError`);
}

async function onOKClick(): Promise<void> {
    if (!(await reservationForm.value?.validate())) return;

    if (props.mode === "create") {
        emit("create", state);
    } else {
        emit("update", state);
    }
}
</script>

<template>
    <q-card-section>
        <q-form ref="reservationForm" class="q-gutter-md q-pt-md">
            <q-input
                data-test="guest-name"
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

            <!-- Selector for choosing between 'User' or 'Social' -->
            <div class="q-mb-md">
                <q-radio v-model="selectionType" val="user" label="Staff" />
                <q-radio v-model="selectionType" val="social" label="Social" />
            </div>

            <!-- Select input for choosing the user or social -->
            <q-select
                v-model="state.reservedBy"
                :options="selectableOptions"
                option-label="name"
                option-value="email"
                :label="reservedByLabel"
                :rules="[requireReservedBySelection]"
                data-test="reserved-by"
            />

            <q-btn
                rounded
                size="md"
                class="button-gradient"
                @click="onOKClick"
                :label="t(`EventCreateReservation.reservationCreateBtn`)"
                data-test="ok-btn"
            />
        </q-form>
    </q-card-section>
</template>
