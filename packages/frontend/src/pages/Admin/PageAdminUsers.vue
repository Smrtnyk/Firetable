<script setup lang="ts">
import UserCreateForm from "components/admin/User/UserCreateForm.vue";
import FTTitle from "components/FTTitle.vue";
import { loadingWrapper, showConfirm, showErrorMessage } from "src/helpers/ui-helpers";
import { computed, watch } from "vue";
import { config } from "src/config";
import { Loading, useQuasar } from "quasar";
import FTDialog from "components/FTDialog.vue";
import { CreateUserPayload, EditUserPayload, User } from "@firetable/types";
import { createUserWithEmail, deleteUser, updateUser } from "@firetable/backend";
import { usePropertiesStore } from "stores/usePropertiesStore";
import { useAdminUsers } from "src/composables/useAdminUsers";

const { maxNumOfUsers } = config;
const propertiesStore = usePropertiesStore();
const { users, isLoading, fetchUsers } = useAdminUsers();
const quasar = useQuasar();
const usersStatus = computed(() => {
    return {
        totalUsers: users.value.length,
        maxUsers: maxNumOfUsers,
    };
});

const onCreateUser = loadingWrapper(async (newUser: CreateUserPayload) => {
    await createUserWithEmail(newUser);
    await fetchUsers();
});

const onUpdateUser = loadingWrapper(async (updatedUser: EditUserPayload) => {
    await updateUser(updatedUser);
    await fetchUsers();
});

const onDeleteUser = loadingWrapper(async (id: string) => {
    await deleteUser(id);
    await fetchUsers();
});

watch(isLoading, (loading) => {
    if (loading) {
        Loading.show();
    } else {
        Loading.hide();
    }
});

function onCreateUserFormSubmit(newUser: CreateUserPayload) {
    if (users.value.length > maxNumOfUsers) {
        showErrorMessage("You have reached the maximum amount of users!");
        return;
    }

    return onCreateUser(newUser);
}

async function showCreateUserDialog(): Promise<void> {
    const properties = await propertiesStore.getPropertiesOfCurrentUser();
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
        propertiesStore.getPropertiesOfCurrentUser(),
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
                submit: (user: CreateUserPayload) => {
                    onUpdateUser({ userId: user.id, updatedUser: user })
                        .then(reset)
                        .catch(showErrorMessage);
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
                        <q-item-label> {{ user.name }} - {{ user.email }} </q-item-label>
                        <q-item-label caption> Role: {{ user.role }} </q-item-label>
                    </q-item-section>
                </q-item>
            </q-slide-item>
        </q-list>
    </div>
</template>
