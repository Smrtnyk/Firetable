<script setup lang="ts">
import FTTitle from "components/FTTitle.vue";
import FTDialog from "components/FTDialog.vue";
import AddNewClubForm from "components/admin/club/AddNewClubForm.vue";

import { useQuasar } from "quasar";
import { loadingWrapper, showConfirm, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
} from "src/composables/useFirestore";
import { where } from "firebase/firestore";
import { ClubDoc, Collection } from "@firetable/types";
import { useAuthStore } from "stores/auth-store";
import { createNewClub } from "@firetable/backend";

const authStore = useAuthStore();
const quasar = useQuasar();

const { data: clubs } = useFirestoreCollection<ClubDoc>(
    createQuery(
        getFirestoreCollection(Collection.CLUBS),
        where("ownerId", "==", authStore.user?.id),
    ),
);

function onClubCreate(clubName: string) {
    return tryCatchLoadingWrapper({
        hook: async () => {
            if (!authStore.user?.id) {
                throw new Error("User ID is not defined!");
            }
            await createNewClub({
                name: clubName,
                ownerId: authStore.user?.id,
            });
            quasar.notify("Club created!");
        },
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onDeleteClub = loadingWrapper(() => {
    // implement
    return Promise.resolve();
});

async function deleteClub(clubToDelete: ClubDoc, reset: () => void): Promise<void> {
    if (await showConfirm("Delete Club?")) {
        return Promise.resolve();
    }
    reset();
}

function createClub(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            title: "Add new Club",
            maximized: false,
            component: AddNewClubForm,
            componentPropsObject: {},
            listeners: {
                create: onClubCreate,
            },
        },
    });
}
</script>

<template>
    <div>
        <FTTitle title="Clubs">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="createClub"
                    label="Add new club"
                />
            </template>
        </FTTitle>
        <q-list v-if="clubs">
            <q-slide-item
                v-for="club in clubs"
                :key="club.id"
                right-color="warning"
                @right="({ reset }) => deleteClub(club, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <q-item clickable class="ft-card">
                    <q-item-section>
                        <q-item-label> {{ club.name }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
