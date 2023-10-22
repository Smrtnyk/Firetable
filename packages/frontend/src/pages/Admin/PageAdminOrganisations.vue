<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewOrganisationForm from "components/admin/organisation/AddNewOrganisationForm.vue";

import { useQuasar } from "quasar";
import { showConfirm, withLoading } from "src/helpers/ui-helpers";
import {
    createNewOrganisation,
    CreateOrganisationPayload,
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

const onOrganisationCreate = withLoading(async function (
    organisationPayload: CreateOrganisationPayload,
) {
    await createNewOrganisation(organisationPayload);
    quasar.notify("organisation created!");
    return fetchOrganisations();
});

const onDeleteOrganisation = withLoading(async (id: string) => {
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
                <q-btn rounded icon="plus" class="button-gradient" @click="createOrganisation" />
            </template>
        </FTTitle>
        <q-list v-if="organisations.length">
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

        <div
            v-if="organisations.length === 0 && !isLoading"
            class="row justify-center items-center q-pa-md"
        >
            <h6 class="q-ma-sm text-weight-bolder underline">
                There are no organisations created.
            </h6>
        </div>
    </div>
</template>
