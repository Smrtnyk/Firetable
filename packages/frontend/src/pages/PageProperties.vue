<script setup lang="ts">
import type { CreatePropertyPayload } from "@firetable/types";

import AddNewPropertyForm from "src/components/admin/property/AddNewPropertyForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import PropertyCardList from "src/components/Property/PropertyCardList.vue";
import { globalDialog } from "src/composables/useDialog";
import { createNewProperty } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { parseAspectRatio } from "src/helpers/utils";
import { useAuthStore } from "src/stores/auth-store";
import { useGlobalStore } from "src/stores/global";
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

const globalStore = useGlobalStore();
const authStore = useAuthStore();
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
    const dialog = globalDialog.openDialog(
        AddNewPropertyForm,
        {
            onCreate(payload: CreatePropertyPayload) {
                onVenueCreate(payload);
                globalDialog.closeDialog(dialog);
            },
            organisationId: props.organisationId,
        },
        {
            title: t("PageAdminProperties.createPropertyDialogTitle"),
        },
    );
}

async function onVenueCreate(payload: CreatePropertyPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewProperty(payload);
            if (authStore.isAdmin) {
                await propertiesStore.initAdminProperties();
            }
            globalStore.notify("Venue created!");
        },
    });
}
</script>

<template>
    <div class="PageHome pa-4">
        <PropertyCardList
            v-if="properties.length > 0"
            :properties="properties"
            :aspect-ratio="cardsAspectRatio"
        />

        <FTCenteredText v-if="showOwnerAdminNoPropertiesMessage">
            <v-icon icon="fas fa-home" size="64" color="grey" class="mb-4" />
            <div class="text-grey-darken-1 mb-8">Create your first venue to get started</div>
            <FTBtn
                label="Create venue"
                icon="fas fa-plus"
                class="button-gradient"
                @click="createVenue"
            />
        </FTCenteredText>

        <FTCenteredText v-if="showRegularUserNoPropertiesMessage">
            <v-icon icon="fas fa-home" size="64" color="grey" class="mb-4" />
            <div class="text-grey-darken-1 mb-8">No venues available</div>
        </FTCenteredText>
    </div>
</template>
