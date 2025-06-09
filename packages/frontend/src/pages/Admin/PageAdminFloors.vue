<script setup lang="ts">
import type { FloorDoc } from "@firetable/types";

import {
    FLOOR_DEFAULT_HEIGHT,
    FLOOR_DEFAULT_WIDTH,
    type FloorData,
} from "@firetable/floor-creator";
import { property } from "es-toolkit/compat";
import AddNewFloorForm from "src/components/Floor/AddNewFloorForm.vue";
import FTCenteredText from "src/components/FTCenteredText.vue";
import FTTitle from "src/components/FTTitle.vue";
import { globalDialog } from "src/composables/useDialog";
import { useFloors } from "src/composables/useFloors";
import { addFloor, deleteFloor } from "src/db";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { useGlobalStore } from "src/stores/global-store";
import { watch } from "vue";
import { useI18n } from "vue-i18n";

interface Props {
    organisationId: string;
    propertyId: string;
}

const { organisationId, propertyId } = defineProps<Props>();

const globalStore = useGlobalStore();
const { t } = useI18n();

const { floors, isLoading } = useFloors(propertyId, organisationId);

watch(isLoading, function (loadingVal) {
    if (loadingVal) {
        globalStore.setLoading(true);
    } else {
        globalStore.setLoading(false);
    }
});

async function duplicateFloor(floor: FloorDoc): Promise<void> {
    const isConfirmed = await globalDialog.confirm({
        message: "",
        title: t("PageAdminFloors.duplicateFloorPlanMessage", { floorName: floor.name }),
    });

    if (!isConfirmed) {
        return;
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
    });
}

function makeRawFloor(name: string): Omit<FloorData, "id" | "json"> {
    return {
        height: FLOOR_DEFAULT_HEIGHT,
        name,
        width: FLOOR_DEFAULT_WIDTH,
    };
}

async function onFloorDelete(id: string): Promise<void> {
    if (
        !(await globalDialog.confirm({
            message: "",
            title: t("PageAdminFloors.deleteFloorMessage"),
        }))
    ) {
        return;
    }

    await tryCatchLoadingWrapper({
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
    const dialog = globalDialog.openDialog(
        AddNewFloorForm,
        {
            allFloorNames: new Set(floorDocs.map(property("name"))),
            onCreate(name: string) {
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
                        ).then(() => dialog.hide());
                    },
                });
            },
        },
        {
            title: "Add New Floor",
        },
    );
}
</script>

<template>
    <div class="PageAdminFloors">
        <FTTitle :title="t('PageAdminFloors.title')">
            <template #right>
                <v-btn
                    rounded
                    icon="fa fa-plus"
                    class="button-gradient"
                    @click="showAddNewFloorForm(floors)"
                    aria-label="Add new floor plan"
                />
            </template>
        </FTTitle>

        <v-list v-if="floors.length > 0" lines="one">
            <v-list-item
                v-for="floor in floors"
                :key="floor.id"
                :to="{
                    name: 'adminFloorEdit',
                    params: {
                        floorId: floor.id,
                        organisationId,
                        propertyId,
                    },
                }"
                link
                class="ft-card mb-2"
            >
                <v-list-item-title>{{ floor.name }}</v-list-item-title>

                <template #append>
                    <v-tooltip location="top">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn
                                v-bind="tooltipProps"
                                icon="fa fa-copy"
                                variant="text"
                                size="small"
                                color="green"
                                @click.stop.prevent="duplicateFloor(floor)"
                                :aria-label="`Duplicate ${floor.name} floor plan`"
                                class="mr-1"
                            />
                        </template>
                        <span>Duplicate</span>
                    </v-tooltip>

                    <v-tooltip location="top">
                        <template #activator="{ props: tooltipProps }">
                            <v-btn
                                v-bind="tooltipProps"
                                icon="fa fa-trash"
                                variant="text"
                                size="small"
                                color="red"
                                @click.stop.prevent="onFloorDelete(floor.id)"
                                :aria-label="`Delete ${floor.name} floor plan`"
                            />
                        </template>
                        <span>Delete</span>
                    </v-tooltip>
                </template>
            </v-list-item>
        </v-list>

        <FTCenteredText v-else>
            {{ t("PageAdminFloors.noFloorPlansMessage") }}
        </FTCenteredText>
    </div>
</template>
