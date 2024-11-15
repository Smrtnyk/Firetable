<script setup lang="ts">
import type { CustomDrinkCardDoc, DrinkBundle, DrinkCardItem } from "@firetable/types";
import {
    formatPrice,
    getElementGroups,
    isBundle,
    isHeader,
    isHeaderEnd,
    isSection,
} from "src/helpers/drink-card/drink-card";
import { computed } from "vue";
import { isMobile } from "src/global-reactives/screen-detection";

interface Props {
    card: CustomDrinkCardDoc;
    logoImgUrl: string | undefined;
}

const props = defineProps<Props>();

const organizedElements = computed(function () {
    return getElementGroups(props.card.elements);
});
const itemsMap = computed(function () {
    const map = new Map<string, DrinkCardItem>();

    organizedElements.value.forEach(function (group) {
        if (!isSection(group.element)) {
            return;
        }

        group.element.items.forEach(function (item) {
            map.set(item.inventoryItemId, item);
        });
    });

    return map;
});

function formatSubCategory(subCategory: string): string {
    return subCategory
        .split("-")
        .map(function (word) {
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
}

function formatServingSize(servingSize: {
    amount: number;
    unit: string;
    displayName?: string;
}): string {
    if (servingSize.displayName) {
        return servingSize.displayName;
    }
    return `${servingSize.amount}${servingSize.unit}`;
}

function getItemName(itemId: string): string {
    const item = itemsMap.value.get(itemId);
    return item ? item.name : "Unknown Item";
}

function calculateRegularPrice(bundle: DrinkBundle): number {
    return bundle.items.reduce(function (total, bundleItem) {
        const item = itemsMap.value.get(bundleItem.inventoryItemId);
        return total + (item?.price ?? 0) * bundleItem.quantity;
    }, 0);
}

function groupItemsBySubcategory(items: DrinkCardItem[]): Map<string, DrinkCardItem[]> {
    const grouped = new Map<string, DrinkCardItem[]>();

    items.forEach(function (item) {
        if (!item.subCategory) {
            return;
        }

        const existing = grouped.get(item.subCategory) ?? [];
        existing.push(item);
        grouped.set(item.subCategory, existing);
    });

    return grouped;
}
</script>

<template>
    <div
        class="drink-card-display"
        :style="{
            backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }"
    >
        <!-- Overlays -->
        <div class="animated-overlay"></div>
        <div class="drink-card-overlay"></div>

        <div class="drink-card-content q-pa-sm q-pa-md-md">
            <q-img
                v-if="props.logoImgUrl && card.showLogo"
                :src="props.logoImgUrl"
                class="logo-img"
            />

            <template
                v-for="({ element, isGrouped }, index) in organizedElements"
                :key="element.id"
            >
                <div :class="{ 'header-group': isGrouped }">
                    <template v-if="isHeader(element)">
                        <h4
                            :class="[
                                isMobile ? 'text-h6' : 'text-h4',
                                'title-text',
                                'q-mb-md',
                                'text-center',
                                'full-width',
                                { 'first-title': index === 0 },
                            ]"
                        >
                            {{ element.name }}
                        </h4>
                    </template>
                    <!-- Skip header-end elements in display -->
                    <template v-else-if="!isHeaderEnd(element)">
                        <template v-if="isSection(element)">
                            <div class="section glassmorphism q-pa-md q-mb-sm q-md-mb-lg">
                                <template
                                    v-for="[subCategory, items] in groupItemsBySubcategory(
                                        element.items,
                                    )"
                                    :key="subCategory"
                                >
                                    <div
                                        class="text-h6 text-white q-mb-sm q-mb-md-sm category-title"
                                    >
                                        {{ formatSubCategory(subCategory) }}
                                    </div>

                                    <!-- Items within Section -->
                                    <div class="items-grid">
                                        <template v-for="item in items" :key="item.inventoryItemId">
                                            <!-- Item -->
                                            <div
                                                v-if="item.isVisible"
                                                class="item-row"
                                                :class="{ 'item-highlighted': item.isHighlighted }"
                                            >
                                                <div class="row items-start justify-between">
                                                    <div class="col-grow">
                                                        <div class="row items-center q-gutter-x-sm">
                                                            <div
                                                                class="text-white text-weight-medium item-name"
                                                            >
                                                                {{ item.name }}
                                                            </div>

                                                            <q-badge
                                                                v-for="tag in item.tags"
                                                                :key="tag"
                                                                color="purple-3"
                                                                text-color="white"
                                                                class="q-px-sm"
                                                            >
                                                                {{ tag }}
                                                            </q-badge>
                                                        </div>

                                                        <div
                                                            v-if="
                                                                card.showItemDescription &&
                                                                (item.brand ||
                                                                    (item.displayOrigin &&
                                                                        item.region))
                                                            "
                                                            class="text-grey-4 text-caption q-mt-xs"
                                                        >
                                                            {{
                                                                [
                                                                    item.brand,
                                                                    item.displayOrigin &&
                                                                        item.region,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(" • ")
                                                            }}
                                                        </div>

                                                        <div
                                                            v-if="
                                                                item.description &&
                                                                card.showItemDescription
                                                            "
                                                            class="text-grey-3 text-caption q-mt-sm description-text"
                                                        >
                                                            {{ item.description }}
                                                        </div>

                                                        <div
                                                            v-if="item.customNote"
                                                            class="text-purple-3 text-caption q-mt-sm"
                                                        >
                                                            {{ item.customNote }}
                                                        </div>

                                                        <div
                                                            class="row items-center q-gutter-x-md q-mt-sm text-caption text-grey-4"
                                                        >
                                                            <div>
                                                                {{
                                                                    formatServingSize(
                                                                        item.servingSize,
                                                                    )
                                                                }}
                                                            </div>
                                                            <div
                                                                v-if="
                                                                    item.displayAlcoholContent &&
                                                                    item.alcoholContent
                                                                "
                                                                class="alcohol-content"
                                                            >
                                                                {{ item.alcoholContent }}% ABV
                                                            </div>
                                                            <div v-if="item.style">
                                                                {{ item.style }}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="text-right">
                                                        <div
                                                            class="text-weight-bold price"
                                                            :class="{
                                                                'price-strikethrough':
                                                                    item.specialPrice?.amount,
                                                            }"
                                                        >
                                                            {{ formatPrice(item.price) }}
                                                        </div>
                                                        <div
                                                            v-if="item.specialPrice?.amount"
                                                            class="special-price"
                                                        >
                                                            <div class="special-price-amount">
                                                                {{
                                                                    formatPrice(
                                                                        item.specialPrice.amount,
                                                                    )
                                                                }}
                                                            </div>
                                                            <div class="special-price-label">
                                                                {{ item.specialPrice.label }}
                                                            </div>
                                                            <div
                                                                v-if="item.specialPrice.description"
                                                                class="special-price-description"
                                                            >
                                                                {{ item.specialPrice.description }}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </template>
                                    </div>
                                </template>
                            </div>
                        </template>

                        <div class="row q-mb-sm q-mb-md-md" v-else-if="isBundle(element)">
                            <div
                                class="col-12 col-md-6 bundle glassmorphism q-pa-md q-mb-sm q-mb-md-lg"
                            >
                                <div class="text-h6 text-white q-mb-md">{{ element.name }}</div>

                                <div class="text-white q-mb-md">{{ element.description }}</div>

                                <div class="bundle-content">
                                    <div class="bundle-items q-mb-md">
                                        <div
                                            v-for="item in element.items"
                                            :key="item.inventoryItemId"
                                        >
                                            {{ item.quantity }}x
                                            {{ getItemName(item.inventoryItemId) }}
                                        </div>
                                    </div>

                                    <div class="bundle-price">
                                        <div class="regular-price text-grey-5">
                                            Value: {{ formatPrice(calculateRegularPrice(element)) }}
                                        </div>
                                        <div class="bundle-price text-h5">
                                            {{ formatPrice(element.price) }}
                                        </div>
                                        <div class="savings text-positive">
                                            Save {{ element.savings?.percentage }}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>
            </template>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.bundle {
    border: 1px solid rgba(250, 82, 222, 0.3);

    .bundle-content {
        display: flex;
        justify-content: space-between;
    }

    .bundle-items {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.9);
    }

    .bundle-price {
        text-align: right;

        .regular-price {
            text-decoration: line-through;
            font-size: 0.9rem;
        }

        .savings {
            margin-top: 4px;
            font-weight: 500;
        }
    }
}

.category-title {
    position: relative;
    padding-bottom: 0.5rem;

    &::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: 0;
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, rgb(250, 82, 222), transparent);
    }
}

.drink-card-display {
    position: relative;
    min-height: 100vh;
    width: 100%;
    background-color: #0a0a0a;
    overflow-x: hidden; // Prevent horizontal scrollbar
    margin-right: calc(-1 * (100vw - 100%));

    // Fallback gradient when no background image
    &:not([style*="background-image"]) {
        background: linear-gradient(45deg, rgba(25, 0, 50, 1) 0%, rgba(10, 0, 20, 1) 100%);
    }
}

.animated-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
    mix-blend-mode: overlay;
    pointer-events: none;
    z-index: 1;

    &::after {
        content: "";
        position: absolute;
        inset: 0;
        background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        opacity: 0.05;
        animation: noiseOpacity 1s steps(2) infinite;
    }
}

.drink-card-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.7) 100%);
    z-index: 2;
}

.drink-card-content {
    position: relative;
    z-index: 3;
    max-width: 1200px;
    margin: 0 auto;
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;

    .logo-img {
        max-width: 300px;
        display: block !important;
        margin: auto !important;
    }
}

.title-text {
    color: #fff;
    font-weight: 700;
    position: relative;
    display: inline-block;
}
.first-title {
    margin-top: 0;
}

.glassmorphism {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    transition: all 0.3s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
}

.header-group {
    margin-bottom: 2rem;

    @media (max-width: 600px) {
        margin-bottom: 0.5rem;
    }
}

.section {
    .items-grid {
        .item-row {
            position: relative;
            padding: 1rem;
            transition: all 0.2s ease;

            @media (max-width: 600px) {
                padding: 0.5rem;
            }

            &::before {
                content: "";
                position: absolute;
                bottom: 0;
                left: 10%;
                right: 10%;
                height: 1px;
                background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.1),
                    transparent
                );
            }

            &:hover {
                background: rgba(255, 255, 255, 0.05);

                .item-name {
                    color: rgb(250, 82, 222);
                }

                .price {
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                }
            }

            &:last-child::before {
                display: none;
            }
        }
    }
}

.special-price {
    margin-top: 4px;
    text-align: right;

    .special-price-amount {
        color: #ff3d71;
        font-weight: bold;
        font-family: "Monaco", monospace;
        letter-spacing: 0.05em;
        font-size: 1.1rem;
        animation: specialPriceGlow 2s ease-in-out infinite alternate;
    }

    .special-price-label {
        font-size: 0.8rem;
        color: #ff3d71;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .special-price-description {
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.7);
        margin-top: 2px;
    }
}

.price-strikethrough {
    position: relative;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;

    &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 2px;
        background: rgba(255, 61, 113, 0.7);
        transform: rotate(-8deg);
        transform-origin: center;
    }
}

@keyframes specialPriceGlow {
    from {
        text-shadow: 0 0 5px rgba(255, 61, 113, 0.5);
    }
    to {
        text-shadow:
            0 0 5px rgba(255, 61, 113, 0.5),
            0 0 10px rgba(255, 61, 113, 0.3);
    }
}

@keyframes noiseOpacity {
    0%,
    100% {
        opacity: 0.05;
    }
    50% {
        opacity: 0.07;
    }
}

.item-highlighted {
    position: relative;
    border: 1px solid rgba(250, 82, 222, 0.3);
    border-radius: 8px;
    background: rgba(250, 82, 222, 0.05);
}

.description-text {
    max-width: 600px;
    line-height: 1.4;
}

.alcohol-content {
    font-family: "Monaco", monospace;
    color: rgba(255, 255, 255, 0.7);
}

.item-row {
    position: relative;
    padding: 1rem;
    transition: all 0.2s ease;
    border-radius: 8px;

    &::before {
        content: "";
        position: absolute;
        bottom: 0;
        left: 10%;
        right: 10%;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    }

    &:hover {
        background: rgba(255, 255, 255, 0.05);

        .item-name {
            color: rgb(250, 82, 222);
        }

        .price {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
    }

    &:last-child::before {
        display: none;
    }
}

.price {
    font-family: "Monaco", monospace;
    letter-spacing: 0.05em;
    transition: text-shadow 0.3s ease;
    font-size: 1.2rem;
    will-change: text-shadow;

    &::before {
        content: "€";
        opacity: 0.8;
        margin-right: 2px;
        font-size: 0.9em;
    }
}

:deep(.q-badge) {
    background: rgba(250, 82, 222, 0.2);
    border: 1px solid rgba(250, 82, 222, 0.3);
    text-transform: uppercase;
    font-size: 0.7rem;
    letter-spacing: 0.5px;
}
</style>
