import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { defineComponent, ref } from "vue";
import { loginWithEmail } from "src/services/firebase/auth";
import { useRouter } from "vue-router";
import { PROJECT_MAIL } from "src/config";
import { minLength, noEmptyString } from "src/helpers/form-rules";

import { QInput, QImg, QBtn, QForm, QIcon } from "quasar";

export default defineComponent({
    name: "Auth",

    components: { QInput, QImg, QBtn, QForm, QIcon },

    setup() {
        const $router = useRouter();

        const username = ref("");
        const password = ref("");
        const isPwd = ref(true);
        const authForm = ref<QForm | null>(null);

        const usernameRule = [noEmptyString()];

        const passwordRule = [
            minLength("Please enter your password, it has to contain minimum 5 characters."),
        ];

        async function onSubmit() {
            if (!(await authForm.value?.validate())) return;
            const validEmail = `${username.value}${PROJECT_MAIL}`;

            await tryCatchLoadingWrapper(async () => {
                await loginWithEmail(validEmail, password.value);
                await $router.replace("/");
            });
        }

        return () => (
            <div class="PageAuth">
                <div class="row window-height items-center q-pa-md justify-center text-center">
                    <div class="col">
                        <q-img class="ft-logo" src="icons/icon-256x256.png" />
                        <q-form ref={authForm}>
                            <h1 class="text-h5 text-center">Welcome to Firetable</h1>
                            <q-input
                                v-model={username.value}
                                rounded
                                class="q-mb-md"
                                standout
                                label="Username *"
                                hint="Enter username"
                                lazy-rules
                                rules={usernameRule}
                            />

                            <q-input
                                v-model={password.value}
                                class="q-mb-md"
                                rounded
                                standout
                                label="Password *"
                                type={isPwd.value ? "password" : "text"}
                                hint="Enter your password"
                                rules={passwordRule}
                            >
                                {{
                                    append: () => (
                                        <q-icon
                                            name={isPwd.value ? "eye-open" : "eye-off"}
                                            className="cursor-pointer"
                                            onClick={() => (isPwd.value = !isPwd.value)}
                                        />
                                    ),
                                }}
                            </q-input>

                            <q-btn
                                rounded
                                size="lg"
                                label="Login"
                                class="button-gradient q-ml-md"
                                onClick={onSubmit}
                            />
                        </q-form>
                    </div>
                </div>
            </div>
        );
    },
});
