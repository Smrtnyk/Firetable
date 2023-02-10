<template>
    <div class="EventCardListSkeleton">
        <div class="row">
            <div
                v-for="index in Array.from<number>({ length: 8 })"
                class="col-12 col-sm-6 col-md-6 q-pa-xs"
                :key="index"
            >
                <q-card class="my-card">
                    <q-card-section>
                        <q-skeleton type="text" class="text-subtitle2" animation="fade" />
                    </q-card-section>
                    <q-skeleton height="100px" square />
                    <q-card-section>
                        <q-skeleton type="text" class="text-subtitle3" animation="fade" />
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>
