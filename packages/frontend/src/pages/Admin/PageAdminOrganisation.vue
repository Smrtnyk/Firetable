<script setup lang="ts">
import { deleteOrganisation } from "../../backend-proxy";
import { usePropertiesStore } from "src/stores/properties-store";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useDialog } from "src/composables/useDialog";
import { useRouter } from "vue-router";

import DeleteOrganisationForm from "src/components/admin/organisation/DeleteOrganisationForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTDialog from "src/components/FTDialog.vue";

export interface PageAdminOrganisationProps {
    organisationId: string;
}

const props = defineProps<PageAdminOrganisationProps>();

const propertiesStore = usePropertiesStore();
const router = useRouter();
const { createDialog } = useDialog();

const organisation = propertiesStore.getOrganisationById(props.organisationId);

function onDeleteOrganisation(): void {
    if (!organisation) {
        return;
    }

    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: "Delete Organisation",
            maximized: false,
            component: DeleteOrganisationForm,
            componentPropsObject: {
                organisation,
            },
            listeners: {
                async delete() {
                    await tryCatchLoadingWrapper({
                        async hook() {
                            await deleteOrganisation(props.organisationId);
                            await propertiesStore.initOrganisations();
                            dialog.hide();
                            await router.replace({ name: "adminOrganisations" });
                        },
                    });
                },
            },
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
                    :color="organisation.status === 'active' ? 'positive' : 'warning'"
                    text-color="white"
                >
                    {{ organisation.status ?? "no status set" }}
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
