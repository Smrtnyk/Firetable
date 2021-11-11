<script setup lang="ts">
import UserCreateForm from "components/User/UserCreateForm.vue";
import FTTitle from "src/components/FTTitle.vue";
import { showConfirm, showErrorMessage, tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { computed } from "vue";
import { createUserWithEmail, deleteUser } from "src/services/firebase/auth";
import { config } from "src/config";
import { useFirestore } from "src/composables/useFirestore";
import { Collection } from "src/types/firebase";
import { CreateUserPayload, User } from "src/types/auth";
import { FloorDoc } from "src/types/floor";
import { useAuthStore } from "src/stores/auth-store";
import { DialogChainObject, useQuasar } from "quasar";
import FTDialog from "components/FTDialog.vue";

const { maxNumOfUsers } = config;
const authStore = useAuthStore();
const quasar = useQuasar();
const floorsMaps = computed(() => floors.value.map(({ name }) => name));
const usersStatus = computed(() => {
    return {
        totalUsers: users.value.length,
        maxUsers: maxNumOfUsers,
    };
});
const { data: users } = useFirestore<User>({
    type: "watch",
    path: Collection.USERS,
});
const { data: floors } = useFirestore<FloorDoc>({
    type: "get",
    path: Collection.FLOORS,
});

async function onCreateUser(newUser: CreateUserPayload, dialog: DialogChainObject) {
    if (users.value.length > maxNumOfUsers) {
        showErrorMessage("You have reached the maximum amount of users!");
        return;
    }

    await tryCatchLoadingWrapper(async () => {
        await createUserWithEmail(newUser);
        dialog.hide();
    });
}

function createUser(): void {
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: "Create new user",
            componentPropsObject: {
                floors: floorsMaps.value,
            },
            listeners: {
                submit: (user: CreateUserPayload) => onCreateUser(user, dialog),
            },
        },
    });
}

function editUser(user: User, reset: () => void) {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: `Editing user: ${user.floors}`,
            componentPropsObject: {
                user: { ...user },
                floors: floorsMaps.value,
            },
            listeners: {
                submit: console.log,
            },
        },
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
                    @click="createUser"
                    label="new user"
                />
            </template>

            <div>
                <span>{{ usersStatus.totalUsers }}</span> /
                <span>{{ usersStatus.maxUsers }}</span>
            </div>
        </FTTitle>

        <q-list v-if="!!users.length">
            <q-slide-item
                v-for="user in users"
                :key="user.id"
                right-color="warning"
                @right="({ reset }) => onUserSlideRight(user, reset)"
                @left="({ reset }) => editUser(user, reset)"
                class="fa-card"
            >
                <template #right>
                    <q-icon name="trash" />
                </template>

                <template #left>
                    <q-icon name="pencil" />
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
