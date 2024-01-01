<script setup lang="ts">
import type { GuestDoc } from "@firetable/types";
import { useFirestoreCollection } from "src/composables/useFirestore";
import { getGuestsPath } from "@firetable/backend";
import { useI18n } from "vue-i18n";
import { showConfirm } from "src/helpers/ui-helpers";

import FTTitle from "src/components/FTTitle.vue";
import { usePropertiesStore } from "src/stores/usePropertiesStore";
import { storeToRefs } from "pinia";

interface Props {
    organisationId: string;
}

const { t } = useI18n();
const props = defineProps<Props>();
const { data: guests } = useFirestoreCollection<GuestDoc>(getGuestsPath(props.organisationId), {
    once: true,
    wait: true,
});
const { properties } = storeToRefs(usePropertiesStore());

async function deleteGuest(guest: GuestDoc, reset: () => void): Promise<void> {
    reset();
    if (!(await showConfirm(t("PageAdminGuests.deleteGuestConfirmationMessage")))) {
        return;
    }
    console.log(guest);
}

async function editGuest(guest: GuestDoc, reset: () => void): Promise<void> {
    reset();
    if (!(await showConfirm(t("PageAdminGuests.editGuestConfirmationMessage")))) {
        return;
    }
    console.log(guest);
}

function showCreateGuestDialog(): void {
    // implement
    console.log("showCreateGuestDialog");
}

function guestVisitsToReadable(guest: GuestDoc): string {
    const res = Object.entries(guest.visitedProperties).map(([propertyId, visits]) => {
        const property = properties.value.find((p) => p.id === propertyId);
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

        <q-list>
            <q-slide-item
                v-for="guest in guests"
                :key="guest.id"
                clickable
                right-color="warning"
                @right="({ reset }) => deleteGuest(guest, reset)"
                @left="({ reset }) => editGuest(guest, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <template #left>
                    <q-icon name="pencil" />
                </template>

                <q-item clickable class="ft-card">
                    <q-item-section>
                        <q-item-label>{{ guest.name }}</q-item-label>
                        <q-item-label caption>{{ guestVisitsToReadable(guest) }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
