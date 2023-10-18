<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useAuthStore } from "src/stores/auth-store";
import FTTitle from "components/FTTitle.vue";
import { User } from "@firetable/types";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { submitNewPassword } from "@firetable/backend";

const authStore = useAuthStore();
const user = computed<User | null>(() => authStore.user);
const isInputEnabled = ref(false);
const newPassword = ref("");
const passwordInput = ref<HTMLElement | null>(null);

function toggleInput() {
    isInputEnabled.value = !isInputEnabled.value;
    if (isInputEnabled.value) {
        nextTick(() => {
            passwordInput.value?.focus();
        });
    }
}

const avatar = computed(() => {
    if (!user.value) return "";
    const [first, last] = user.value.name.split(" ");
    if (!last) {
        return first[0];
    }
    return `${first[0]}${last[0]}`;
});

async function changePassword() {
    if (!newPassword.value) return; // Add more validations if needed

    await tryCatchLoadingWrapper({
        hook: () => submitNewPassword(newPassword.value),
    });
}
</script>

<template>
    <div class="PageProfile" v-if="user">
        <FTTitle :title="`Profile of ${user.name}`" />
        <q-item>
            <q-item-section side>
                <q-avatar size="48px" class="ft-avatar">
                    {{ avatar }}
                </q-avatar>
            </q-item-section>
            <q-item-section>
                <q-card class="ft-card q-pa-md">
                    <q-item-label>{{ user.email }}</q-item-label>
                    <q-separator class="q-my-sm" />
                    <q-item-label v-if="user.name">Name: {{ user.name }}</q-item-label>
                    <q-item-label>Role: {{ user.role }}</q-item-label>
                </q-card>
            </q-item-section>
        </q-item>

        <q-item class="q-mt-md">
            <q-item-section>
                <div style="position: relative">
                    <q-input
                        ref="passwordInput"
                        v-model="newPassword"
                        :disable="isInputEnabled === false"
                        placeholder="Enter new password"
                        clearable
                    ></q-input>
                    <q-btn
                        flat
                        dense
                        icon="pencil"
                        @click="toggleInput"
                        :color="isInputEnabled ? 'primary' : 'grey'"
                        :title="isInputEnabled ? 'Disable input' : 'Enable input'"
                        style="
                            position: absolute;
                            right: 8px;
                            top: 50%;
                            transform: translateY(-50%);
                        "
                    />
                </div>

                <q-btn
                    @click="changePassword"
                    label="Update Password"
                    class="q-mt-sm button-gradient"
                    :disable="!newPassword"
                />
            </q-item-section>
        </q-item>
    </div>
</template>
