<template>
    <div class="TelNumberInput">
        <div class="TelNumberInput__container">
            <!-- Country Code Select -->
            <div class="TelNumberInput__country-select">
                <q-select
                    v-model="selectedCountry"
                    hide-bottom-space
                    :options="countryOptions"
                    option-label="name"
                    :label="t('TelNumberInput.countryCodeLabel')"
                    :use-input="!selectedCountry"
                    @filter="onFilterCountries"
                    clearable
                    clear-icon="fas fa-times"
                    :clear-icon-label="t('TelNumberInput.clearButtonLabel')"
                    :rules="[validateCountrySelection]"
                    outlined
                    dense
                    class="TelNumberInput__country-field"
                >
                    <template #option="scope">
                        <q-item v-bind="scope.itemProps" class="TelNumberInput__country-option">
                            <q-item-section avatar>
                                <img :src="scope.opt.flag" alt="" class="TelNumberInput__flag" />
                            </q-item-section>
                            <q-item-section>
                                <div class="TelNumberInput__country-info">
                                    <span class="TelNumberInput__country-name">{{
                                        scope.opt.name
                                    }}</span>
                                    <span class="TelNumberInput__dial-code"
                                        >+{{ scope.opt.dialCode }}</span
                                    >
                                </div>
                            </q-item-section>
                        </q-item>
                    </template>

                    <template #selected-item="{ opt }">
                        <div class="TelNumberInput__selected">
                            <img :src="opt.flag" alt="" class="TelNumberInput__flag" />
                            <span class="TelNumberInput__selected-code">+{{ opt.dialCode }}</span>
                        </div>
                    </template>

                    <template #prepend>
                        <i class="fas fa-globe TelNumberInput__icon" />
                    </template>
                </q-select>
            </div>

            <!-- Phone Number Input -->
            <div class="TelNumberInput__phone-input">
                <q-input
                    v-model="phoneNumber"
                    :label="t('TelNumberInput.phoneNumberLabel')"
                    type="tel"
                    outlined
                    dense
                    :rules="[validatePhoneNumber]"
                    @blur="onPhoneNumberBlur"
                    class="TelNumberInput__phone-field"
                >
                    <template #prepend>
                        <i class="fas fa-phone TelNumberInput__icon" />
                    </template>
                </q-input>
            </div>
        </div>

        <!-- Helper Text -->
        <div class="TelNumberInput__helper" v-if="fullNumber">
            <i class="fas fa-check-circle TelNumberInput__helper-icon" />
            <span class="TelNumberInput__helper-text">{{ fullNumber }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { AnyFunction } from "@firetable/types";
import type { CountryCode } from "libphonenumber-js";

import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import { QInput, QSelect } from "quasar";
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { Country } from "./european-countries";

import europeanCountries from "./european-countries";

export interface TelNumberInputProps {
    modelValue: string | undefined;
    required?: boolean;
}

const { modelValue, required = false } = defineProps<TelNumberInputProps>();
const emit = defineEmits(["update:modelValue"]);
const { t } = useI18n();

const fullNumber = computed(function () {
    if (selectedCountry.value && phoneNumber.value) {
        return `+${selectedCountry.value.dialCode}${phoneNumber.value}`;
    }
    return "";
});
const selectedCountry = ref<Country | undefined>();
const phoneNumber = ref("");
const countryOptions = ref<Country[]>(europeanCountries);

watch(
    () => modelValue,
    function (newVal) {
        if (newVal && newVal !== fullNumber.value) {
            const parsedNumber = parsePhoneNumberFromString(newVal);
            if (parsedNumber) {
                const countryOption = europeanCountries.find(
                    ({ iso2 }) => iso2.toUpperCase() === parsedNumber.country,
                );
                if (countryOption) {
                    selectedCountry.value = countryOption;
                    phoneNumber.value = parsedNumber.nationalNumber;
                }
            }
        }
    },
    { immediate: true },
);

function emitPhoneNumber(): void {
    if (!selectedCountry.value && !phoneNumber.value) {
        emit("update:modelValue", "");
        return;
    }

    if (validatePhoneNumber() === true && selectedCountry.value) {
        emit("update:modelValue", fullNumber.value);
    } else {
        emit("update:modelValue", "");
    }
}

function onFilterCountries(val: string, update: AnyFunction): void {
    if (val === "") {
        update(function () {
            countryOptions.value = europeanCountries;
        });
        return;
    }

    update(function () {
        const needle = val.toLowerCase();
        countryOptions.value = europeanCountries.filter(function (country) {
            return (
                country.name.toLowerCase().includes(needle) ??
                country.dialCode.includes(needle) ??
                country.iso2.toLowerCase().includes(needle)
            );
        });
    });
}

function onPhoneNumberBlur(): void {
    if (!validatePhoneNumber() || !selectedCountry.value || !phoneNumber.value) {
        return;
    }
    const asYouType = new AsYouType(selectedCountry.value.iso2.toUpperCase() as CountryCode);
    asYouType.input(phoneNumber.value);
    const output = asYouType.getNumber();
    if (output) {
        phoneNumber.value = output.nationalNumber;
    }
    emitPhoneNumber();
}

function validateCountrySelection(): boolean | string {
    const country = selectedCountry.value;
    const number = phoneNumber.value;

    if (required) {
        if (!country) {
            return t("TelNumberInput.selectCountryCodeValidationMsg");
        }
    } else if (number && !country) {
        return t("TelNumberInput.selectCountryCodeValidationMsg");
    }
    return true;
}

function validatePhoneNumber(): boolean | string {
    const country = selectedCountry.value;
    const number = phoneNumber.value;

    if (required) {
        if (!country || !number) {
            return t("TelNumberInput.provideCountryAndNumberValidationMsg");
        }
    } else {
        if (!country && !number) {
            return true;
        }
        if ((country && !number) || (!country && number)) {
            return t("TelNumberInput.provideCountryAndNumberValidationMsg");
        }
    }

    if (!country) {
        return t("TelNumberInput.selectCountryCodeValidationMsg");
    }

    const phoneNumberObj = parsePhoneNumberFromString(fullNumber.value);
    if (!phoneNumberObj?.isValid()) {
        return t("TelNumberInput.invalidPhoneNumberValidationMsg");
    }

    return true;
}

watch([selectedCountry, phoneNumber], emitPhoneNumber);
</script>

<style lang="scss" scoped>
.TelNumberInput {
    &__container {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }

    &__country-select {
        flex: 0 0 200px; // Fixed width for country select
    }

    &__phone-input {
        flex: 1; // Take remaining space
    }

    &__country-field,
    &__phone-field {
        :deep(.q-field__control) {
            border-radius: $button-border-radius;
            border-color: $border-light;
            transition: all 0.2s ease;

            &:hover {
                border-color: $primary;
            }
        }

        :deep(.q-field--focused .q-field__control) {
            border-color: $primary;
            box-shadow: 0 0 0 3px rgba($primary, 0.1);
        }

        :deep(.q-field__label) {
            color: $text-secondary;
            font-weight: 500;
        }
    }

    &__icon {
        color: $text-tertiary;
        font-size: 14px;
    }

    &__country-option {
        padding: 8px 16px;

        &:hover {
            background: rgba($primary, 0.05);
        }
    }

    &__flag {
        width: 20px;
        height: 14px;
        border-radius: 2px;
        object-fit: cover;
    }

    &__country-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
    }

    &__country-name {
        font-weight: 500;
        color: $text-primary;
    }

    &__dial-code {
        color: $text-secondary;
        font-weight: 600;
        font-size: 14px;
    }

    &__selected {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
    }

    &__selected-code {
        font-weight: 600;
        color: $text-primary;
        font-size: 14px;
    }

    &__helper {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        padding: 8px 12px;
        background: rgba($accent, 0.1); // Changed from $success to $accent
        border-radius: $button-border-radius;
        border-left: 3px solid $accent; // Changed from $success to $accent
    }

    &__helper-icon {
        color: $accent; // Changed from $success to $accent
        font-size: 12px;
    }

    &__helper-text {
        color: $accent; // Changed from $success to $accent
        font-weight: 600;
        font-size: 14px;
        font-family: "JetBrains Mono", monospace;
    }
}

// Dark mode support
.body--dark .TelNumberInput {
    &__country-field,
    &__phone-field {
        :deep(.q-field__control) {
            border-color: $border-light-dark;
            background: $surface-elevated-dark;

            &:hover {
                border-color: $primary;
            }
        }

        :deep(.q-field__label) {
            color: $text-secondary-dark;
        }
    }

    &__icon {
        color: $text-tertiary-dark;
    }

    &__country-option {
        &:hover {
            background: rgba($primary, 0.1);
        }
    }

    &__country-name {
        color: $text-primary-dark;
    }

    &__dial-code {
        color: $text-secondary-dark;
    }

    &__selected-code {
        color: $text-primary-dark;
    }

    &__helper {
        background: rgba($accent, 0.15);
    }

    &__helper-text {
        color: $accent;
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .TelNumberInput {
        &__container {
            flex-direction: column;
            gap: 12px; // Reduced gap
        }

        &__country-select,
        &__phone-input {
            flex: 1;
            width: 100%; // Ensure full width
        }

        &__country-field,
        &__phone-field {
            :deep(.q-field__control) {
                min-height: 48px; // Better touch target
            }
        }

        &__helper {
            margin-top: 12px;
            padding: 10px 12px;
        }
    }
}

@media (max-width: 480px) {
    .TelNumberInput {
        &__container {
            gap: 10px;
        }

        &__country-field,
        &__phone-field {
            :deep(.q-field__control) {
                min-height: 44px; // Slightly smaller for very small screens
            }

            :deep(.q-field__label) {
                font-size: 14px;
            }
        }

        &__country-info {
            flex-direction: row; // Keep horizontal on mobile
            justify-content: space-between;
            align-items: center;
            gap: 8px;
        }

        &__country-name {
            font-size: 14px;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &__dial-code {
            font-size: 13px;
            flex-shrink: 0;
        }

        &__selected {
            gap: 6px;
        }

        &__selected-code {
            font-size: 13px;
        }

        &__helper {
            padding: 8px 10px;
            margin-top: 10px;
        }

        &__helper-text {
            font-size: 12px;
        }

        &__icon {
            font-size: 13px;
        }
    }
}
</style>
