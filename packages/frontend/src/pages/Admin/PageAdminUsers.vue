<script setup lang="ts">
import UserCreateForm from "components/admin/User/UserCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import { loadingWrapper, showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed } from "vue";
import { config } from "src/config";
import { useAuthStore } from "src/stores/auth-store";
import { useQuasar } from "quasar";
import FTDialog from "components/FTDialog.vue";
import { documentId, where } from "firebase/firestore";
import { Collection, CreateUserPayload, User } from "@firetable/types";
import { createUserWithEmail, deleteUser, updateUser } from "@firetable/backend";
import {
    createQuery,
    getFirestoreCollection,
    useFirestoreCollection,
} from "src/composables/useFirestore";
import { usePropertiesStore } from "stores/usePropertiesStore";

const { maxNumOfUsers } = config;
const authStore = useAuthStore();
const propertiesStore = usePropertiesStore();
const quasar = useQuasar();
const usersStatus = computed(() => {
    return {
        totalUsers: users.value.length,
        maxUsers: maxNumOfUsers,
    };
});
const { data: users } = useFirestoreCollection<User>(
    createQuery(
        getFirestoreCollection(Collection.USERS),
        where(documentId(), "!=", authStore.user?.id),
    ),
);

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

async function showCreateUserDialog(): Promise<void> {
    const properties = await propertiesStore.getPropertiesOnce();
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: "Create new user",
            componentPropsObject: {
                properties,
            },
            listeners: {
                submit: function (userPayload: CreateUserPayload) {
                    onCreateUserFormSubmit(userPayload);
                    dialog.hide();
                },
            },
        },
    });
}

async function showEditUserDialog(user: User, reset: () => void) {
    if (!(await showConfirm(`Are you sure you want to edit user ${user.name}?`, ""))) {
        reset();
        return;
    }
    const [properties, selectedProperties] = await Promise.all([
        propertiesStore.getPropertiesOnce(),
        propertiesStore.getPropertiesOfUser(user.id),
    ]);
    const dialog = quasar.dialog({
        component: FTDialog,
        componentProps: {
            component: UserCreateForm,
            maximized: false,
            title: `Editing user: ${user.name}`,
            componentPropsObject: {
                user: { ...user },
                properties,
                selectedProperties,
            },
            listeners: {
                submit: (updatedUser: Partial<CreateUserPayload>) => {
                    onUpdateUser(user.id, updatedUser).then(reset).catch(showErrorMessage);
                    dialog.hide();
                },
            },
        },
    });
}

async function onUserSlideRight(id: string, reset: () => void) {
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
                    v-if="users"
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
                @right="({ reset }) => onUserSlideRight(user.id, reset)"
                @left="({ reset }) => showEditUserDialog(user, reset)"
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
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
