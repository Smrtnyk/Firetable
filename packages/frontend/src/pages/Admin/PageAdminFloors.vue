<script setup lang="ts">
import type { FloorDoc, VoidFunction } from "@firetable/types";

import {
    FLOOR_DEFAULT_HEIGHT,
    FLOOR_DEFAULT_WIDTH,
    type FloorData,
} from "@firetable/floor-creator";
import { property } from "es-toolkit/compat";
import { Loading } from "quasar";
import AddNewFloorForm from "src/components/Floor/AddNewFloorForm.vue";
import FTBtn from "src/components/FTBtn.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTDialog from "src/components/FTDialog.vue";
import FTTitle from "src/components/FTTitle.vue";
import { useDialog } from "src/composables/useDialog";
import { useFloors } from "src/composables/useFloors";
import { addFloor, deleteFloor } from "src/db";
import { showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { watch } from "vue";
import { useI18n } from "vue-i18n";

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
                    id: propertyId,
                    organisationId,
                },
                duplicatedFloor,
            );
        },
    }).finally(reset);
}

function makeRawFloor(name: string): Omit<FloorData, "id" | "json"> {
    return {
        height: FLOOR_DEFAULT_HEIGHT,
        name,
        width: FLOOR_DEFAULT_WIDTH,
    };
}

async function onFloorDelete(id: string, reset: VoidFunction): Promise<void> {
    if (!(await showConfirm(t("PageAdminFloors.deleteFloorMessage")))) {
        return reset();
    }

    await tryCatchLoadingWrapper({
        errorHook: reset,
        hook() {
            return deleteFloor(
                {
                    id: propertyId,
                    organisationId,
                },
                id,
            );
        },
    });
}

function showAddNewFloorForm(floorDocs: FloorDoc[]): void {
    const dialog = createDialog({
        component: FTDialog,
        componentProps: {
            component: AddNewFloorForm,
            componentPropsObject: {
                allFloorNames: new Set(floorDocs.map(property("name"))),
            },
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
                                    id: propertyId,
                                    organisationId,
                                },
                                rawFloor,
                            ).then(dialog.hide);
                        },
                    });
                },
            },
            maximized: false,
            title: "Add New Floor",
        },
    });
}
</script>

<template>
    <div class="PageAdminFloors">
        <FTTitle :title="t('PageAdminFloors.title')">
            <template #right>
                <FTBtn
                    rounded
                    icon="fa fa-plus"
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
                    <q-icon name="fa fa-trash" />
                </template>
                <template #left>
                    <q-icon name="fa fa-copy" />
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

        <FTCenteredText v-else>
            {{ t("PageAdminFloors.noFloorPlansMessage") }}
        </FTCenteredText>
    </div>
</template>
