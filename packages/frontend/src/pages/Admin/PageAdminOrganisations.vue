<script setup lang="ts">
import type { CreateOrganisationPayload } from "@firetable/backend";
import type { Link } from "src/types";

import { createNewOrganisation } from "@firetable/backend";
import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const quasar = useQuasar();
const { createDialog } = useDialog();
const isLoading = ref(false);
const { organisations } = storeToRefs(usePropertiesStore());
const propertiesStore = usePropertiesStore();

function createLinks(organisationId: string): Link[] {
    const params = { organisationId };
    return [
        {
            icon: "users",
            label: t("AppDrawer.links.manageUsers"),
            route: { name: "adminUsers", params },
        },
        {
            icon: "users",
            label: t("AppDrawer.links.manageGuests"),
            route: { name: "adminGuests", params },
        },
        {
            icon: "home",
            label: t("AppDrawer.links.manageProperties"),
            route: { name: "adminProperties", params },
        },
        {
            icon: "link",
            label: "Go to Organisation Page",
            route: { name: "adminOrganisation", params },
        },
    ];
}

function createOrganisation(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewOrganisationForm,
            componentPropsObject: {},
            listeners: {
                create(organisationPayload: CreateOrganisationPayload) {
                    onOrganisationCreate(organisationPayload);
                    dialog.hide();
                },
            },
            maximized: false,
            title: "Add new Organisation",
        },
    });
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
                </q-list>
            </q-expansion-item>
        </q-list>

        <FTCenteredText v-if="organisations.length === 0 && !isLoading">
            There are no organisations created.
        </FTCenteredText>
    </div>
</template>
