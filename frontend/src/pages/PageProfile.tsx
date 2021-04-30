import { computed, defineComponent } from "vue";
import { User } from "src/types";
import { useStore } from "src/store";

import { FTTitle } from "components/FTTitle";

import {
    QItem,
    QItemSection,
    QAvatar,
    QImg,
    QCard,
    QItemLabel,
    QSeparator,
} from "quasar";

export default defineComponent({
    name: "PageProfile",
    components: {
        QItem,
        QItemSection,
        QAvatar,
        QImg,
        QCard,
        QItemLabel,
        QSeparator,

        FTTitle,
    },

    setup() {
        const store = useStore();
        const user = computed<User>(() => store.state.auth.user as User);
        const avatar = computed(
            () =>
                `https://avatars.dicebear.com/api/human/${user.value.email}.svg`
        );

        return () => (
            <div class="PageProfile">
                <f-t-title title={`Profile of ${user.value.name}`} />
                <q-item>
                    <q-item-section side>
                        <q-avatar size="48px" class="ft-avatar">
                            <q-img src={avatar.value} />
                        </q-avatar>
                    </q-item-section>
                    <q-item-section>
                        <q-card class="ft-card q-pa-md">
                            <q-item-label>{user.value.email}</q-item-label>
                            <q-separator class="q-my-sm" />

                            {user.value.name && (
                                <q-item-label>
                                    Name: {user.value.name}
                                </q-item-label>
                            )}

                            <q-item-label>Role: {user.value.role}</q-item-label>

                            <q-item-label>
                                Region: {user.value.region}
                            </q-item-label>

                            {user.value.address && (
                                <q-item-label>
                                    {user.value.address}
                                </q-item-label>
                            )}

                            {user.value.mobile && (
                                <q-item-label>{user.value.mobile}</q-item-label>
                            )}
                        </q-card>
                    </q-item-section>
                </q-item>
            </div>
        );
    },
});
