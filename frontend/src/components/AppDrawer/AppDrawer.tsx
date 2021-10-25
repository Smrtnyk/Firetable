import "./AppDrawer.scss";

import { computed, defineComponent, ref, watch, withDirectives } from "vue";
import { User } from "src/types/auth";
import { tryCatchLoadingWrapper } from "src/helpers/ui-helpers";
import { logoutUser, updateUser } from "src/services/firebase/auth";
import { useQuasar, Ripple, LocalStorage } from "quasar";
import { useStore } from "src/store";
import { useI18n } from "vue-i18n";

import {
    QSeparator,
    QItem,
    QItemSection,
    QToggle,
    QList,
    QAvatar,
    QImg,
    QIcon,
    QSelect,
} from "quasar";

export default defineComponent({
    name: "AppDrawer",
    props: {
        showAdminLinks: {
            type: Boolean,
            required: true,
        },
    },

    components: {
        QSeparator,
        QItem,
        QItemSection,
        QToggle,
        QList,
        QAvatar,
        QImg,
        QIcon,
        QSelect,
    },

    setup(props) {
        const store = useStore();
        const q = useQuasar();
        const { t, locale } = useI18n();

        const lang = ref(locale);
        const langOptions = [
            { value: "en-GB", label: "English" },
            { value: "de", label: "German" },
        ];

        const adminLinks = computed(() => [
            {
                icon: "calendar",
                routeName: "adminEvents",
                text: t("AppDrawer.links.manageEvents"),
            },
            {
                icon: "users",
                routeName: "adminUsers",
                text: t("AppDrawer.links.manageUsers"),
            },
            {
                icon: "arrow-expand",
                routeName: "adminFloors",
                text: t("AppDrawer.links.manageFloors"),
            },
        ]);
        const user = computed(() => store.state.auth.user);
        const adminLinksCollection = computed(() =>
            props.showAdminLinks ? adminLinks.value : []
        );
        const avatar = computed(
            () =>
                `https://avatars.dicebear.com/api/human/${user.value?.email}.svg`
        );

        function setDarkMode(newValue: boolean) {
            q.dark.set(newValue);
            q.localStorage.set("FTDarkMode", newValue);
        }

        function toggleUserActivityStatus(newValue: boolean) {
            if (!user.value) return;

            void updateUser(user.value.id, "status", Number(newValue));
        }

        function onLogoutUser() {
            void tryCatchLoadingWrapper(() =>
                logoutUser().then(store.state.auth.unsubscribeUserWatch)
            );
        }

        function setAppLanguage(val: string) {
            LocalStorage.set("FTLang", val);
            locale.value = val;
        }

        return () => (
            <q-list>
                <q-item header class="column items-center q-pt-xl q-pb-lg">
                    <q-avatar size="6rem" class="ft-avatar">
                        <div
                            class={[
                                {
                                    green: user.value?.status,
                                },
                                "status-dot",
                            ]}
                        />
                        <q-img src={avatar.value} />
                    </q-avatar>
                    <div class="q-mt-md text-center">
                        <div class="text-subtitle1">{user.value?.name}</div>
                        <div class="text-caption text-grey">
                            {user.value?.email}
                        </div>
                        <div class="text-caption text-grey">
                            {user.value?.status ? "Online" : "Offline"}
                        </div>
                    </div>
                </q-item>

                {adminLinksCollection.value.length && <q-separator />}

                {adminLinksCollection.value.map((link, index) =>
                    withDirectives(
                        <q-item
                            key={index}
                            to={{ name: link.routeName }}
                            clickable
                        >
                            <q-item-section avatar>
                                <q-icon name={link.icon} />
                            </q-item-section>
                            <q-item-section>{link.text}</q-item-section>
                        </q-item>,
                        [[Ripple]]
                    )
                )}

                <q-separator spaced />

                {withDirectives(
                    <q-item clickable onClick={onLogoutUser}>
                        <q-item-section avatar>
                            <q-icon name="logout" />
                        </q-item-section>

                        <q-item-section>
                            {t("AppDrawer.links.logout")}
                        </q-item-section>
                    </q-item>,
                    [[Ripple]]
                )}

                <q-separator spaced />
                <q-item>
                    <q-select
                        model-value={lang.value}
                        options={langOptions}
                        label="Language"
                        dense
                        borderless
                        emit-value
                        map-options
                        options-dense
                        {...{ "onUpdate:modelValue": setAppLanguage }}
                    />
                </q-item>
                <q-separator spaced />
                <q-item>
                    <q-toggle
                        model-value={q.dark.isActive}
                        {...{ "onUpdate:modelValue": setDarkMode }}
                        checked-icon="moon"
                        color="red"
                        label="Toggle dark mode"
                        unchecked-icon="sun"
                        size="lg"
                    />
                </q-item>
                <q-item>
                    <q-toggle
                        model-value={!!user.value?.status}
                        checked-icon="status-online"
                        color="green"
                        label="Toggle online status"
                        unchecked-icon="status-offline"
                        size="lg"
                        {...{ "onUpdate:modelValue": toggleUserActivityStatus }}
                    />
                </q-item>
            </q-list>
        );
    },
});
