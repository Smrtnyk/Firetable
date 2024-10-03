<script setup lang="ts">
import type { CreateGuestPayload, GuestDoc } from "@firetable/types";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { createGuest, getGuestsPath } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { storeToRefs } from "pinia";

import AddNewGuestForm from "src/components/admin/guest/AddNewGuestForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import { matchesProperty } from "es-toolkit/compat";
import { useDialog } from "src/composables/useDialog";

interface Props {
    organisationId: string;
}

const { createDialog } = useDialog();
const { t } = useI18n();
const props = defineProps<Props>();
const { data: guests } = useFirestoreCollection<GuestDoc>(getGuestsPath(props.organisationId), {
    wait: true,
});
const { properties } = storeToRefs(usePropertiesStore());

function showCreateGuestDialog(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Guest",
            maximized: false,
            component: AddNewGuestForm,
            listeners: {
                create(payload: CreateGuestPayload) {
                    dialog.hide();

                    tryCatchLoadingWrapper({
                        hook() {
                            return createGuest(props.organisationId, payload);
                        },
                    });
                },
            },
        },
    });
}

function guestVisitsToReadable(guest: GuestDoc): string {
    if (Object.keys(guest.visitedProperties).length === 0) {
        return "No visits recorded";
    }

    const res = Object.entries(guest.visitedProperties).map(function ([propertyId, visits]) {
        const property = properties.value.find(matchesProperty("id", propertyId));
        if (!property) {
            return "";
        }
        const visitsCount = Object.values(visits).filter(Boolean).length;
        if (!visitsCount) {
            return "";
        }
        return `${property.name} visits: ${visitsCount}`;
    });
    return res.join(", ");
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle :title="t('PageAdminGuests.title')">
            <template #right>
                <q-btn rounded icon="plus" class="button-gradient" @click="showCreateGuestDialog" />
            </template>
        </FTTitle>

        <q-list v-if="guests.length > 0">
            <q-item
                v-for="guest in guests"
                :key="guest.contact"
                clickable
                class="bg-dark"
                :to="{
                    name: 'adminGuest',
                    params: {
                        organisationId: props.organisationId,
                        guestId: guest.id,
                    },
                }"
            >
                <q-item-section>
                    <q-item-label>{{ guest.name }} - {{ guest.contact }}</q-item-label>
                    <q-item-label caption>{{ guestVisitsToReadable(guest) }}</q-item-label>
                </q-item-section>
            </q-item>
        </q-list>

        <FTCenteredText v-else>No guests data</FTCenteredText>
    </div>
</template>
