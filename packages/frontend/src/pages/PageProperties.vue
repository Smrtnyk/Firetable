<script setup lang="ts">
import type { CreatePropertyPayload } from "@firetable/types";

import { useQuasar } from "quasar";
import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { parseAspectRatio } from "src/helpers/utils";
import { usePermissionsStore } from "src/stores/permissions-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

interface Props {
    organisationId: string;
}

const props = defineProps<Props>();
const router = useRouter();
const propertiesStore = usePropertiesStore();
const permissionsStore = usePermissionsStore();
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { createNewProperty } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useAuthStore } from "src/stores/auth-store";

const quasar = useQuasar();
const authStore = useAuthStore();
const { createDialog } = useDialog();
const { t } = useI18n();

const properties = computed(function () {
    return propertiesStore.getPropertiesByOrganisationId(props.organisationId);
});

const settings = computed(function () {
    return propertiesStore.getOrganisationSettingsById(props.organisationId);
});

const cardsAspectRatio = computed(function () {
    return parseAspectRatio(settings.value.property.propertyCardAspectRatio);
});

onMounted(function () {
    if (!props.organisationId) {
        router.replace("/");
    }
});

const showOwnerAdminNoPropertiesMessage = computed(function () {
    return properties.value.length === 0 && permissionsStore.canCreateProperties;
});

const showRegularUserNoPropertiesMessage = computed(function () {
    return properties.value.length === 0 && !permissionsStore.canCreateProperties;
});

function createVenue(): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewPropertyForm,
            componentPropsObject: {
                organisationId: props.organisationId,
            },
            listeners: {
                create(payload: CreatePropertyPayload) {
                    onVenueCreate(payload);
                    dialog.hide();
                },
            },
            maximized: false,
            title: t("PageAdminProperties.createPropertyDialogTitle"),
        },
    });
}

async function onVenueCreate(payload: CreatePropertyPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewProperty(payload);
            if (authStore.isAdmin) {
                await propertiesStore.initAdminProperties();
            }
            quasar.notify("Venue created!");
        },
    });
}
</script>

<template>
    <div class="PageHome">
        <FTTitle title="Venues" />
        <PropertyCardList
            v-if="properties.length > 0"
            :properties="properties"
            :aspect-ratio="cardsAspectRatio"
        />

        <FTCenteredText v-if="showOwnerAdminNoPropertiesMessage">
            <q-icon name="fa fa-home" size="64px" color="grey-5" class="q-mb-md" />
            <div class="text-grey-6 q-mb-lg">Create your first venue to get started</div>
            <FTBtn
                label="Create venue"
                icon="fa fa-plus"
                class="button-gradient"
                @click="createVenue"
            />
        </FTCenteredText>

        <FTCenteredText v-if="showRegularUserNoPropertiesMessage">
            <q-icon name="fa fa-home" size="64px" color="grey-5" class="q-mb-md" />
            <div class="text-grey-6 q-mb-lg">No venues available</div>
        </FTCenteredText>
    </div>
</template>
