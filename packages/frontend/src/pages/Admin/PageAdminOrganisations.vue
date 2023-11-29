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

type Link = {
    label: string;
    icon: string;
    route: { name: string; params: Record<string, string> };
};

const { t } = useI18n();
const quasar = useQuasar();
const isLoading = ref(false);

const organisations = ref<OrganisationDoc[]>([]);

onMounted(fetchOrganisations);

function createLinks(organisationId: string): Link[] {
    return [
        {
            label: t("AppDrawer.links.manageEvents"),
            icon: "calendar",
            route: { name: "adminEvents", params: { organisationId } },
        },
        {
            label: t("AppDrawer.links.manageUsers"),
            icon: "users",
            route: { name: "adminUsers", params: { organisationId } },
        },
        {
            label: t("AppDrawer.links.manageFloors"),
            icon: "arrow-expand",
            route: { name: "adminFloors", params: { organisationId } },
        },
        {
            label: t("AppDrawer.links.manageProperties"),
            icon: "home",
            route: { name: "adminProperties", params: { organisationId } },
        },
        {
            label: "Manage Analytics",
            icon: "line-chart",
            route: { name: "adminAnalytics", params: { organisationId } },
        },
    ];
}

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
                    <q-item
                        v-for="item of createLinks(organisation.id)"
                        :key="item.label"
                        clickable
                        class="ft-card"
                        :to="item.route"
                    >
                        <q-item-section avatar>
                            <q-icon :name="item.icon" />
                        </q-item-section>
                        <q-item-section>
                            {{ item.label }}
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
