<script setup lang="ts">
import { reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useDialogPluginComponent, QForm } from "quasar";
import { minLength, noEmptyString, requireNumber } from "src/helpers/form-rules";

interface State {
    guestName: string;
    numberOfGuests: number;
    guestContact: string;
    reservationNote: string;
    groupedWith: string[];
}

interface Props {
    tableId: string;
    freeTables: string[];
}

const props = defineProps<Props>();
// eslint-disable-next-line vue/valid-define-emits
const emit = defineEmits(useDialogPluginComponent.emits);
const { t } = useI18n();
const state = reactive<State>({
    guestName: "",
    numberOfGuests: 2,
    guestContact: "",
    reservationNote: "",
    groupedWith: [],
});
const reservationForm = ref<QForm | null>(null);
const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent();

async function onOKClick() {
    if (!(await reservationForm.value?.validate())) return;

    state.groupedWith.push(props.tableId);

    onDialogOK(state);
}
</script>
<template>
    <q-dialog ref="dialogRef" persistent @hide="onDialogHide" maximized>
        <q-card class="q-dialog-plugin AddTableDialog">
            <q-banner inline-actions rounded class="bg-gradient text-white">
                <template #avatar>
                    <q-btn round flat icon="close" @click="onDialogCancel" />
                </template>
                {{ "TABLE" + props.tableId }}
            </q-banner>

            <q-card-section>
                <q-form ref="reservationForm" class="q-gutter-md">
                    <q-select
                        v-if="props.freeTables.length"
                        v-model="state.groupedWith"
                        :hint="t(`EventCreateReservation.reservationGroupWithHint`)"
                        standout
                        rounded
                        multiple
                        :options="props.freeTables"
                        :label="t(`EventCreateReservation.reservationGroupWith`)"
                        dropdown-icon="selector"
                    />
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
                        :rules="[requireNumber()]"
                    />

                    <q-input
                        v-model="state.guestContact"
                        rounded
                        standout
                        class="q-mb-md"
                        :label="t(`EventCreateReservation.reservationGuestContact`)"
                    />

                    <q-input v-model="state.reservationNote" rounded standout label="Note" />

                    <div>
                        <q-btn rounded size="md" class="button-gradient" @click="onOKClick">
                            {{ t("EventCreateReservation.reservationCreateBtn") }}
                        </q-btn>
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>
</template>
