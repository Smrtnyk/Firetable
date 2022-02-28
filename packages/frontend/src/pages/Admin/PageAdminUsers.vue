<script setup lang="ts">
import UserCreateForm from "components/User/UserCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import { showConfirm } from "src/helpers/ui-helpers";
import { computed } from "vue";
import { config } from "src/config";
import { useFirestore } from "src/composables/useFirestore";
import { useAuthStore } from "src/stores/auth-store";
import { useQuasar } from "quasar";
import FTDialog from "components/FTDialog.vue";
import { documentId, query as firestoreQuery, where } from "@firebase/firestore";
import { useFirestoreDoc } from "src/composables/useFirestoreDoc";
import { RoleDoc } from "src/types/roles";
import { Collection, CreateUserPayload, FloorDoc, User } from "@firetable/types";
import { createUserWithEmail, deleteUser, ROLES_PATH, updateUser } from "@firetable/backend";
import { loadingWrapper, showErrorMessage } from "@firetable/utils";

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
    query(collectionRef) {
        const idConstraint = where(documentId(), "!=", authStore.user?.id);
        return firestoreQuery(collectionRef, idConstraint);
    },
});
const { data: floors } = useFirestore<FloorDoc>({
    type: "get",
    path: Collection.FLOORS,
});
const { data: rolesDoc } = useFirestoreDoc<RoleDoc>({
    type: "get",
    path: ROLES_PATH,
});

const onCreateUser = loadingWrapper((newUser: CreateUserPayload) => {
    return createUserWithEmail(newUser);
});

const onUpdateUser = loadingWrapper((userId: string, updatedUser: Partial<CreateUserPayload>) => {
    return updateUser(userId, updatedUser);
});

const onDeleteUser = loadingWrapper((id: string) => {
    return deleteUser(id);
});

function onCreateUserFormSubmit(newUser: CreateUserPayload) {
    if (users.value.length > maxNumOfUsers) {
        showErrorMessage("You have reached the maximum amount of users!");
        return;
    }

    return onCreateUser(newUser);
}

function showCreateUserDialog(): void {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: "Create new user",
            componentPropsObject: {
                floors: floorsMaps.value,
                roles: rolesDoc.value?.roles || [],
            },
            listeners: {
                submit: onCreateUserFormSubmit,
            },
        },
    });
}

function showEditUserDialog(user: User) {
    quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: `Editing user: ${user.name}`,
            componentPropsObject: {
                user: { ...user },
                floors: floorsMaps.value,
                roles: rolesDoc.value?.roles || [],
            },
            listeners: {
                submit: (updatedUser: Partial<CreateUserPayload>) =>
                    onUpdateUser(user.id, updatedUser),
            },
        },
    });
}

async function onUserSlideRight({ id }: User, reset: () => void) {
    if (await showConfirm("Delete user?")) {
        return onDeleteUser(id);
    }
    reset();
}
</script>

<template>
    <div class="PageAdminUsers">
        <FTTitle title="Users">
            <template #right>
                <q-btn
                    v-if="rolesDoc"
                    rounded
                    icon="plus"
                    class="button-gradient"
                    @click="showCreateUserDialog"
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
                @left="() => showEditUserDialog(user)"
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
                        <q-item-label caption> Role: {{ user.role }} </q-item-label>
                        <q-item-label caption> Floors: {{ user.floors.join(", ") }} </q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
