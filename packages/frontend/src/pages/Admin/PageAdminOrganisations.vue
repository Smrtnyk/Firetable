<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { storeToRefs } from "pinia";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTCard from "src/components/FTCard.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useAppTheme } from "src/composables/useAppTheme";
import { globalDialog } from "src/composables/useDialog";
import { createNewOrganisation } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global-store";
import { usePropertiesStore } from "src/stores/properties-store";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

const { t } = useI18n();
const router = useRouter();
const searchQuery = ref("");
const globalStore = useGlobalStore();
const { organisations } = storeToRefs(usePropertiesStore());
const propertiesStore = usePropertiesStore();
const { isDark } = useAppTheme();

const filteredOrganisations = computed(function () {
    if (!searchQuery.value) return organisations.value;

    const query = searchQuery.value.toLowerCase();
    return organisations.value.filter(function (org) {
        return org.name.toLowerCase().includes(query);
    });
});

function createOrganisation(): void {
    const dialog = globalDialog.openDialog(
        AddNewOrganisationForm,
        {
            onCreate(organisationPayload: CreateOrganisationPayload) {
                onOrganisationCreate(organisationPayload);
                dialog.hide();
            },
        },
        {
            title: t("PageAdminOrganisations.addNewOrganisationTitle"),
        },
    );
}

function navigateToOrganisation(organisationId: string): void {
    router.push({ name: "adminOrganisation", params: { organisationId } });
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            globalStore.notify(t("PageAdminOrganisations.organisationCreatedSuccess"));
            return propertiesStore.initOrganisations();
        },
    });
}
</script>

<template>
    <div>
        <FTTitle :title="t('PageAdminOrganisations.title')">
            <template #right>
                <v-btn
                    rounded="pill"
                    icon="fa:fas fa-plus"
                    color="primary"
                    flat
                    variant="elevated"
                    density="comfortable"
                    @click="createOrganisation"
                    :aria-label="t('PageAdminOrganisations.createOrganisationButton')"
                />
            </template>
        </FTTitle>

        <!-- Search Bar -->
        <div class="search-section mb-6" v-if="organisations.length > 0">
            <v-text-field
                v-model="searchQuery"
                variant="outlined"
                density="compact"
                :placeholder="t('PageAdminOrganisations.searchPlaceholder')"
                class="search-input"
                clearable
                @click:clear="searchQuery = ''"
            >
                <template v-slot:prepend-inner>
                    <v-icon icon="fa:fas fa-search" />
                </template>
            </v-text-field>
        </div>

        <!-- Organisation Cards Grid -->
        <div class="organisations-grid" v-if="filteredOrganisations.length > 0">
            <FTCard
                v-for="organisation in filteredOrganisations"
                :key="organisation.id"
                class="organisation-card"
                @click="navigateToOrganisation(organisation.id)"
                link
            >
                <!-- Card Header -->
                <v-card-text class="card-header pa-4">
                    <div class="header-content">
                        <v-avatar
                            :color="isDark ? 'primary' : 'primary'"
                            text-color="white"
                            size="40"
                            class="org-avatar"
                        >
                            <v-icon icon="fa:fas fa-briefcase" size="24" />
                        </v-avatar>
                        <div class="org-info">
                            <h6 class="org-name text-h6 my-0">{{ organisation.name }}</h6>
                            <div class="text-caption text-grey-darken-1">
                                Organisation ID: {{ organisation.id.slice(0, 8) }}...
                            </div>
                        </div>
                    </div>
                </v-card-text>
            </FTCard>
        </div>

        <!-- Empty State -->
        <FTCenteredText v-if="organisations.length === 0">
            <v-icon icon="fa:fas fa-briefcase" size="64" color="grey-lighten-1" class="mb-4" />
            <div class="text-grey-darken-1 mb-6">
                {{ t("PageOrganisations.noOrganisationsMessage") }}
            </div>
            <v-btn
                icon="fa:fas fa-plus"
                color="primary"
                variant="elevated"
                @click="createOrganisation"
            >
                {{ t("PageAdminOrganisations.createOrganisationButton") }}
            </v-btn>
        </FTCenteredText>

        <!-- No Search Results -->
        <FTCenteredText v-if="organisations.length > 0 && filteredOrganisations.length === 0">
            <v-icon
                icon="fa:fas fa-magnifying-glass-minus"
                size="64"
                color="grey-lighten-1"
                class="mb-4"
            />
            <div class="text-h6 mb-2">
                {{ t("PageAdminOrganisations.noOrganisationsFound") }}
            </div>
            <div class="text-grey-darken-1">
                {{ t("PageAdminOrganisations.adjustSearchCriteria") }}
            </div>
        </FTCenteredText>
    </div>
</template>

<style scoped lang="scss">
.search-section {
    margin-left: auto;
    margin-right: auto;
}

.organisations-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;

    @media (max-width: 599px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}

.organisation-card {
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
        transform: translateY(-2px);
    }

    .card-header {
        .header-content {
            display: flex;
            align-items: center;
            gap: 16px;

            .org-avatar {
                flex-shrink: 0;
            }

            .org-info {
                flex: 1;
                min-width: 0;

                .org-name {
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }
    }
}

.v-theme--light .text-grey-darken-1 {
    color: #757575 !important;
}
.v-theme--dark .text-grey-darken-1 {
    color: #bdbdbd !important;
}

.v-theme--light .text-grey-lighten-1 {
    color: #bdbdbd !important;
}
.v-theme--dark .text-grey-lighten-1 {
    color: #616161 !important;
}
</style>
