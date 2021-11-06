<script setup lang="ts">
import UserCreateForm from "components/User/UserCreateForm.vue";
import { FTTitle } from "src/components/FTTitle";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed } from "vue";
import { createUserWithEmail, deleteUser } from "src/services/firebase/auth";
import { config } from "src/config";
import { useFirestore } from "src/composables/useFirestore";
import { Collection } from "src/types/firebase";
import { CreateUserPayload, User } from "src/types/auth";
import { FloorDoc } from "src/types/floor";
import { useAuthStore } from "src/stores/auth-store";

const { maxNumOfUsers } = config;
const authStore = useAuthStore();
const floorsMaps = computed(() => floors.value.map(({ name }) => name));
const usersStatus = computed(() => {
    return {
        totalUsers: users.value.length,
        maxUsers: maxNumOfUsers,
    };
});
const { data: users } = useFirestore<User>({
    type: "watch",
    queryType: "collection",
    path: Collection.USERS,
});
const { data: floors } = useFirestore<FloorDoc>({
    type: "get",
    queryType: "collection",
    path: Collection.FLOORS,
});

async function onCreateUser(newUser: CreateUserPayload) {
    if (users.value.length > maxNumOfUsers) {
        showErrorMessage("You have reached the maximum amount of users!");
        return;
    }

    await tryCatchLoadingWrapper(async () => {
        await createUserWithEmail(newUser);
        authStore.toggleCreateUserDialogVisibility();
    });
}

async function onUserSlideRight({ id }: User, reset: () => void) {
    if (await showConfirm("Delete user?")) {
        await tryCatchLoadingWrapper(() => deleteUser(id));
        return;
    }
    reset();
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle title="Users">
            <template #right>
                <q-btn
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="authStore.toggleCreateUserDialogVisibility"
                    label="new user"
                />
            </template>

            <div>
                <span>{{ usersStatus.totalUsers }}</span> /
                <span>{{ usersStatus.maxUsers }}</span>
            </div>
        </FTTitle>

        <user-create-form
            v-if="floorsMaps.length"
            :floors="floorsMaps"
            @close="authStore.toggleCreateUserDialogVisibility"
            @submit="onCreateUser"
        />

        <q-list v-if="!!users.length">
            <q-slide-item
                v-for="user in users"
                :key="user.id"
                right-color="warning"
                @right="({ reset }) => onUserSlideRight(user, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <q-item clickable class="ft-card">
                    <q-item-section>
                        <q-item-label> {{ user.name }} -{{ user.email }} </q-item-label>
                        <q-item-label caption> ROLE: {{ user.role }} </q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
