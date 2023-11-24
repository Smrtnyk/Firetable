<script setup lang="ts">
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";

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
import FTCenteredText from "src/components/FTCenteredText.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const quasar = useQuasar();
const isLoading = ref(false);

const organisations = ref<OrganisationDoc[]>([]);

onMounted(fetchOrganisations);

async function fetchOrganisations(): Promise<void> {
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
        <q-list bordered class="rounded-borders" v-if="organisations.length > 0">
            <q-expansion-item
                expand-separator
                v-for="organisation in organisations"
                :key="organisation.id"
                expand-icon="arrow_drop_down"
                :label="organisation.name"
                class="ft-card"
            >
                <q-list>
                    <!-- Admin Events -->
                    <q-item
                        clickable
                        class="ft-card"
                        :to="{ name: 'adminEvents', params: { organisationId: organisation.id } }"
                    >
                        <q-item-section avatar>
                            <q-icon name="calendar" />
                        </q-item-section>
                        <q-item-section>
                            {{ t("AppDrawer.links.manageEvents") }}
                        </q-item-section>
                    </q-item>

                    <!-- Admin Users -->
                    <q-item
                        clickable
                        class="ft-card"
                        :to="{ name: 'adminUsers', params: { organisationId: organisation.id } }"
                    >
                        <q-item-section avatar>
                            <q-icon name="users" />
                        </q-item-section>
                        <q-item-section>
                            {{ t("AppDrawer.links.manageUsers") }}
                        </q-item-section>
                    </q-item>

                    <!-- Admin Floors -->
                    <q-item
                        clickable
                        class="ft-card"
                        :to="{ name: 'adminFloors', params: { organisationId: organisation.id } }"
                    >
                        <q-item-section avatar>
                            <q-icon name="arrow-expand" />
                        </q-item-section>
                        <q-item-section>
                            {{ t("AppDrawer.links.manageFloors") }}
                        </q-item-section>
                    </q-item>

                    <!-- Admin Properties -->
                    <q-item
                        clickable
                        class="ft-card"
                        :to="{
                            name: 'adminProperties',
                            params: { organisationId: organisation.id },
                        }"
                    >
                        <q-item-section avatar>
                            <q-icon name="arrow-expand" />
                        </q-item-section>
                        <q-item-section>
                            {{ t("AppDrawer.links.manageProperties") }}
                        </q-item-section>
                    </q-item>
                </q-list>

                <q-separator />

                <q-slide-item
                    right-color="warning"
                    @right="({ reset }) => deleteOrganisationAsync(organisation.id, reset)"
                >
                    <template #right>
                        <q-icon name="trash" />
                    </template>
                </q-slide-item>
            </q-expansion-item>
        </q-list>

        <FTCenteredText v-if="organisations.length === 0 && !isLoading">
            There are no organisations created.
        </FTCenteredText>
    </div>
</template>
