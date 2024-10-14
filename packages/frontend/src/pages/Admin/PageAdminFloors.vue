<script setup lang="ts">
import type { FloorDoc, VoidFunction } from "@firetable/types";

import AddNewFloorForm from "src/components/Floor/AddNewFloorForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";

import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { Loading } from "quasar";
import { makeRawFloor } from "@firetable/floor-creator";
import { addFloor, deleteFloor } from "@firetable/backend";
import { useFloors } from "src/composables/useFloors";
import { watch } from "vue";
import { useI18n } from "vue-i18n";
import { property } from "es-toolkit/compat";
import { useDialog } from "src/composables/useDialog";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();

const { createDialog } = useDialog();
const { t } = useI18n();

const { floors, isLoading } = useFloors(propertyId, organisationId);

watch(isLoading, function (loadingVal) {
    if (loadingVal) {
        Loading.show();
    } else {
        Loading.hide();
    }
});

function showAddNewFloorForm(floorDocs: FloorDoc[]): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            title: "Add New Floor",
            component: AddNewFloorForm,
            maximized: false,
            listeners: {
                create(name: string) {
                    tryCatchLoadingWrapper({
                        hook() {
                            const rawFloor = {
                                ...makeRawFloor(name),
                                propertyId,
                            };

                            return addFloor(
                                {
                                    organisationId,
                                    id: propertyId,
                                },
                                rawFloor,
                            ).then(dialog.hide);
                        },
                    });
                },
            },
            componentPropsObject: {
                allFloorNames: new Set(floorDocs.map(property("name"))),
            },
        },
    });
}

async function duplicateFloor(floor: FloorDoc, reset: VoidFunction): Promise<void> {
    const isConfirmed = await showConfirm(
        t("PageAdminFloors.duplicateFloorPlanMessage", { floorName: floor.name }),
    );

    if (!isConfirmed) {
        return reset();
    }

    const duplicatedFloor = { ...floor, name: `${floor.name}_copy` };
    await tryCatchLoadingWrapper({
        hook() {
            return addFloor(
                {
                    organisationId,
                    id: propertyId,
                },
                duplicatedFloor,
            );
        },
    }).finally(reset);
}

async function onFloorDelete(id: string, reset: VoidFunction): Promise<void> {
    if (!(await showConfirm(t("PageAdminFloors.deleteFloorMessage")))) {
        return reset();
    }

    await tryCatchLoadingWrapper({
        hook() {
            return deleteFloor(
                {
                    organisationId,
                    id: propertyId,
                },
                id,
            );
        },
        errorHook: reset,
    });
}
</script>

<template>
    <div class="PageAdminFloors">
        <FTTitle :title="t('PageAdminFloors.title')">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showAddNewFloorForm(floors)"
                />
            </template>
        </FTTitle>

        <!-- If the property has floors, display them -->
        <q-list v-if="floors.length > 0">
            <q-slide-item
                v-for="floor in floors"
                :key="floor.id"
                right-color="red"
                left-color="green"
                @right="({ reset }) => onFloorDelete(floor.id, reset)"
                @left="({ reset }) => duplicateFloor(floor, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>
                <template #left>
                    <q-icon name="copy" />
                </template>
                <q-item
                    v-ripple
                    clickable
                    :to="{
                        name: 'adminFloorEdit',
                        params: {
                            floorId: floor.id,
                            organisationId,
                            propertyId,
                        },
                    }"
                >
                    <q-item-section>
                        <q-item-label>{{ floor.name }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>

        <!-- If the property doesn't have floors, display a standout message -->
        <FTCenteredText v-else>
            {{ t("PageAdminFloors.noFloorPlansMessage") }}
        </FTCenteredText>
    </div>
</template>
