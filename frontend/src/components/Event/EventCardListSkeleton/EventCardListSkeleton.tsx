import { defineComponent } from "vue";

import { QCard, QCardSection, QSkeleton } from "quasar";

export default defineComponent({
    name: "EventCardListSkeleton",

    components: { QCard, QCardSection, QSkeleton },

    setup() {
        return () => (
            <div class="EventCardListSkeleton">
                <div class="row">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <div
                            class="col-12 col-sm-6 col-md-4 q-pa-xs"
                            key={index}
                        >
                            <q-card class="my-card">
                                <q-card-section>
                                    <q-skeleton
                                        type="text"
                                        class="text-subtitle2"
                                        width="50%"
                                        animation="fade"
                                    />
                                </q-card-section>
                                <q-skeleton height="100px" square />
                                <q-card-section>
                                    <q-skeleton
                                        type="text"
                                        class="text-subtitle3"
                                        animation="fade"
                                    />
                                </q-card-section>
                            </q-card>
                        </div>
                    ))}
                </div>
            </div>
        );
    },
});
