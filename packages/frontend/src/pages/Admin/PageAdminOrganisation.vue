<script setup lang="ts">
import { deleteOrganisation } from "@firetable/backend";
import FTBtn from "src/components/FTBtn.vue";
import FTTitle from "src/components/FTTitle.vue";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { showDeleteConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { useRouter } from "vue-router";

export interface PageAdminOrganisationProps {
    organisationId: string;
}

const props = defineProps<PageAdminOrganisationProps>();
const propertiesStore = usePropertiesStore();
const router = useRouter();

const organisation = propertiesStore.getOrganisationById(props.organisationId);

async function onDeleteOrganisation(): Promise<void> {
    if (!organisation) {
        return;
    }

    const shouldDeleteOrganisation = await showDeleteConfirm(
        "Delete Organisation?",
        `This action cannot be undone.`,
        organisation.name,
    );

    if (!shouldDeleteOrganisation) {
        return;
    }

    await tryCatchLoadingWrapper({
        async hook() {
            await deleteOrganisation(props.organisationId);
            await propertiesStore.initOrganisations();
            await router.replace({ name: "adminOrganisations" });
        },
    });
}
</script>

<template>
    <div v-if="organisation">
        <FTTitle :title="organisation.name">
            <template #right>
                <q-chip
                    aria-label="Organisation status"
                    class="q-mr-md"
                    :color="getOrganisationStatusColor(organisation.status)"
                    text-color="white"
                >
                    {{ formatOrganisationStatus(organisation.status) }}
                </q-chip>
                <FTBtn
                    icon="trash"
                    aria-label="Open delete organisation dialog"
                    rounded
                    color="negative"
                    @click="onDeleteOrganisation"
                />
            </template>
        </FTTitle>
    </div>
</template>
