<script setup lang="ts">
import type { CreateOrganisationPayload } from "@firetable/backend";
import type { Link } from "src/types";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTBtn from "src/components/FTBtn.vue";

import { useQuasar } from "quasar";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { createNewOrganisation, deleteOrganisation } from "@firetable/backend";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { usePropertiesStore } from "src/stores/properties-store";

const { t } = useI18n();
const quasar = useQuasar();
const isLoading = ref(false);
const { organisations } = storeToRefs(usePropertiesStore());
const propertiesStore = usePropertiesStore();

function createLinks(organisationId: string): Link[] {
    const params = { organisationId };
    return [
        {
            label: t("AppDrawer.links.manageUsers"),
            icon: "users",
            route: { name: "adminUsers", params },
        },
        {
            label: t("AppDrawer.links.manageGuests"),
            icon: "users",
            route: { name: "adminGuests", params },
        },
        {
            label: t("AppDrawer.links.manageProperties"),
            icon: "home",
            route: { name: "adminProperties", params },
        },
        {
            label: t("AppDrawer.links.settings"),
            icon: "cog-wheel",
            route: { name: "adminOrganisationSettings", params },
        },
    ];
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            quasar.notify("organisation created!");
            return propertiesStore.initOrganisations();
        },
    });
}

async function onDeleteOrganisation(id: string): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await deleteOrganisation(id);
            await propertiesStore.initOrganisations();
        },
    });
}

async function deleteOrganisationAsync(organisationId: string): Promise<void> {
    if (await showConfirm("Delete organisation?")) {
        return onDeleteOrganisation(organisationId);
    }
}

function createOrganisation(): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Organisation",
            maximized: false,
            component: AddNewOrganisationForm,
            componentPropsObject: {},
            listeners: {
                create(organisationPayload: CreateOrganisationPayload) {
                    onOrganisationCreate(organisationPayload);
                    dialog.hide();
                },
            },
        },
    });
}
</script>

<template>
    <div>
        <FTTitle title="Organisations">
            <template #right>
                <FTBtn rounded icon="plus" class="button-gradient" @click="createOrganisation" />
            </template>
        </FTTitle>
        <q-list bordered class="rounded-borders" v-if="organisations.length > 0">
            <q-expansion-item
                expand-separator
                v-for="organisation in organisations"
                :key="organisation.id"
                expand-icon="arrow_drop_down"
                :label="organisation.name"
            >
                <q-list>
                    <q-item
                        v-for="item of createLinks(organisation.id)"
                        :key="item.label"
                        clickable
                        :to="item.route"
                    >
                        <q-item-section avatar>
                            <q-icon :name="item.icon" />
                        </q-item-section>
                        <q-item-section>
                            {{ item.label }}
                        </q-item-section>
                    </q-item>
                    <q-item clickable @click="deleteOrganisationAsync(organisation.id)">
                        <q-item-section avatar>
                            <q-icon name="trash" color="red" />
                        </q-item-section>
                        <q-item-section> Delete Organisation </q-item-section>
                    </q-item>
                </q-list>
            </q-expansion-item>
        </q-list>

        <FTCenteredText v-if="organisations.length === 0 && !isLoading">
            There are no organisations created.
        </FTCenteredText>
    </div>
</template>
