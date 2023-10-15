<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewOrganisationForm from "components/admin/organisation/AddNewOrganisationForm.vue";

import { useQuasar } from "quasar";
import { loadingWrapper, showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    createNewOrganisation,
    deleteOrganisation,
    fetchOrganisationsForAdmin,
} from "@firetable/backend";
import { OrganisationDoc } from "@firetable/types";
import { onMounted, ref } from "vue";

const quasar = useQuasar();
const isLoading = ref(false);

const organisations = ref<OrganisationDoc[]>([]);

onMounted(fetchOrganisations);

async function fetchOrganisations() {
    isLoading.value = true;
    organisations.value = await fetchOrganisationsForAdmin();
    isLoading.value = false;
}

function onOrganisationCreate(organisationName: string) {
    return tryCatchLoadingWrapper({
        hook: async () => {
            await createNewOrganisation({
                name: organisationName,
            });
            quasar.notify("organisation created!");
            void fetchOrganisations();
        },
    });
}

const onDeleteOrganisation = loadingWrapper(async (id: string) => {
    await deleteOrganisation(id);
    await fetchOrganisations();
});

async function deleteOrganisationAsync(organisationId: string, reset: () => void): Promise<void> {
    if (await showConfirm("Delete organisation?")) {
        return onDeleteOrganisation(organisationId);
    }
    reset();
}

function createOrganisation(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Organisation",
            maximized: false,
            component: AddNewOrganisationForm,
            componentPropsObject: {},
            listeners: {
                create: onOrganisationCreate,
            },
        },
    });
}
</script>

<template>
    <div>
        <FTTitle title="Organisations">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createOrganisation"
                    label="Add new organisation"
                />
            </template>
        </FTTitle>
        <q-list v-if="organisations">
            <q-slide-item
                v-for="organisation in organisations"
                :key="organisation.id"
                right-color="warning"
                @right="({ reset }) => deleteOrganisationAsync(organisation.id, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <q-item clickable class="ft-card">
                    <q-item-section>
                        <q-item-label> {{ organisation.name }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
