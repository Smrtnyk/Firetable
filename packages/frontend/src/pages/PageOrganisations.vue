<script setup lang="ts">
import type { CreateOrganisationPayload } from "src/db";

import { storeToRefs } from "pinia";
import { useQuasar } from "quasar";
import AddNewOrganisationForm from "src/components/admin/organisation/AddNewOrganisationForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { createNewOrganisation } from "src/db";
import {
    formatOrganisationStatus,
    getOrganisationStatusColor,
} from "src/helpers/organisation/organisation";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { usePropertiesStore } from "src/stores/properties-store";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const propertiesStore = usePropertiesStore();
const { organisations } = storeToRefs(usePropertiesStore());
const quasar = useQuasar();

const { createDialog } = useDialog();

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
            title: t("PageOrganisations.addNewOrganisationTitle"),
        },
    });
}

async function onOrganisationCreate(organisationPayload: CreateOrganisationPayload): Promise<void> {
    await tryCatchLoadingWrapper({
        async hook() {
            await createNewOrganisation(organisationPayload);
            quasar.notify({
                message: t("PageOrganisations.organisationCreatedSuccess"),
                type: "success",
            });
            return propertiesStore.initOrganisations();
        },
    });
}
</script>

<template>
    <div class="PageOrganisations">
        <FTTitle title="Organisations" />

        <div class="row q-col-gutter-md" v-if="organisations.length > 0">
            <div
                class="col-12 col-sm-6 col-lg-4"
                v-for="organisation of organisations"
                :key="organisation.id"
            >
                <router-link
                    :to="{
                        name: 'properties',
                        params: { organisationId: organisation.id },
                    }"
                    class="OrganisationCard__link"
                >
                    <div class="OrganisationCard">
                        <!-- Header Section -->
                        <div class="OrganisationCard__header">
                            <div class="OrganisationCard__icon">
                                <i class="fas fa-building" />
                            </div>
                            <div class="OrganisationCard__status">
                                <q-chip
                                    :color="getOrganisationStatusColor(organisation.status)"
                                    text-color="white"
                                    size="sm"
                                    class="OrganisationCard__status-chip"
                                >
                                    {{ formatOrganisationStatus(organisation.status) }}
                                </q-chip>
                            </div>
                        </div>

                        <!-- Title Section -->
                        <div class="OrganisationCard__title">
                            <h3>{{ organisation.name }}</h3>
                        </div>

                        <!-- Stats Section -->
                        <div class="OrganisationCard__stats">
                            <div class="OrganisationCard__stat">
                                <div class="OrganisationCard__stat-icon">
                                    <i class="fas fa-home" />
                                </div>
                                <div class="OrganisationCard__stat-content">
                                    <span class="OrganisationCard__stat-label">
                                        {{ t("PageOrganisations.propertiesLimit") }}
                                    </span>
                                    <span class="OrganisationCard__stat-value">
                                        {{ organisation.maxAllowedProperties }}
                                    </span>
                                </div>
                            </div>

                            <div class="OrganisationCard__stat">
                                <div class="OrganisationCard__stat-icon">
                                    <i class="fas fa-map" />
                                </div>
                                <div class="OrganisationCard__stat-content">
                                    <span class="OrganisationCard__stat-label">
                                        {{ t("PageOrganisations.floorPlansPerEvent") }}
                                    </span>
                                    <span class="OrganisationCard__stat-value">
                                        {{
                                            organisation.subscriptionSettings
                                                ?.maxFloorPlansPerEvent ?? "N/A"
                                        }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </router-link>
            </div>
        </div>

        <div v-else>
            <FTCenteredText>
                <q-icon name="fa fa-briefcase" size="64px" color="grey-5" class="q-mb-md" />
                <div class="text-grey-6 q-mb-lg">
                    {{ t("PageOrganisations.noOrganisationsMessage") }}
                </div>
                <FTBtn
                    :label="t('PageOrganisations.createOrganisationButton')"
                    icon="fa fa-plus"
                    class="button-gradient"
                    @click="createOrganisation"
                />
            </FTCenteredText>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.OrganisationCard {
    background: $surface-elevated;
    border-radius: $generic-border-radius;
    padding: 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: $box-shadow;
    border: 1px solid $border-light;
    height: 100%;
    display: flex;
    flex-direction: column;

    &:hover {
        box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.12),
            0 0 0 1px rgba($primary, 0.2);
        border-color: rgba($primary, 0.2);
    }

    &__link {
        text-decoration: none;
        color: inherit;
        display: block;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 20px;
    }

    &__icon {
        width: 48px;
        height: 48px;
        background: $gradient-primary;
        border-radius: $generic-border-radius;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
    }

    &__status {
        &-chip {
            border-radius: $button-border-radius !important;
            font-weight: 600;
        }
    }

    &__title {
        margin-bottom: 24px;

        h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: $text-primary;
            line-height: 1.3;
        }
    }

    &__stats {
        display: flex;
        flex-direction: column;
        gap: 16px;
        flex: 1;
    }

    &__stat {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: $surface-secondary;
        border-radius: $button-border-radius;
        border: 1px solid $border-light;

        &-icon {
            width: 32px;
            height: 32px;
            background: rgba($primary, 0.1);
            border-radius: $button-border-radius;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $primary;
            font-size: 14px;
        }

        &-content {
            display: flex;
            flex-direction: column;
            flex: 1;
        }

        &-label {
            font-size: 12px;
            color: $text-tertiary;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        &-value {
            font-size: 16px;
            color: $text-primary;
            font-weight: 700;
            margin-top: 2px;
        }
    }
}

// Dark mode support
.body--dark .OrganisationCard {
    background: $surface-elevated-dark;
    border-color: $border-light-dark;
    box-shadow:
        0 2px 12px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1);

    &:hover {
        box-shadow:
            0 4px 16px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba($primary, 0.4);
        border-color: rgba($primary, 0.4);
    }

    .OrganisationCard__title h3 {
        color: $text-primary-dark;
    }

    .OrganisationCard__stat {
        background: $surface-container-dark;
        border-color: $border-light-dark;

        &-icon {
            background: rgba($primary, 0.2);
            color: $accent;
        }

        &-label {
            color: $text-tertiary-dark;
        }

        &-value {
            color: $text-primary-dark;
        }
    }
}

// Responsive adjustments
@media (max-width: 768px) {
    .OrganisationCard {
        padding: 20px;

        &__title h3 {
            font-size: 18px;
        }

        &__stats {
            gap: 12px;
        }

        &__stat {
            padding: 10px;

            &-value {
                font-size: 14px;
            }
        }
    }
}

@media (max-width: 480px) {
    .OrganisationCard {
        padding: 16px;

        &__icon {
            width: 40px;
            height: 40px;
            font-size: 18px;
        }

        &__title h3 {
            font-size: 16px;
        }
    }
}
</style>
