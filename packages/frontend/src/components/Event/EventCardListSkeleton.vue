<template>
    <div class="EventCardListSkeleton">
        <div class="row">
            <div v-for="index of range(0, 8)" class="col-12 col-sm-6 col-md-6 q-pa-xs" :key="index">
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

<script setup lang="ts">
import { range } from "@firetable/utils";
</script>
