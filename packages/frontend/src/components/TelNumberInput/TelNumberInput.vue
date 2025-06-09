<template>
    <div>
        <v-row>
            <v-col cols="5" sm="4">
                <v-autocomplete
                    variant="outlined"
                    v-model="selectedCountry"
                    :items="countryOptions"
                    item-title="name"
                    return-object
                    :label="t('TelNumberInput.countryCodeLabel')"
                    @update:search="onFilterCountries"
                    clearable
                    clear-icon="fas fa-times"
                    :rules="[validateCountrySelection]"
                >
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props" :title="false">
                            <template #prepend>
                                <v-avatar size="24" class="mr-3">
                                    <img :src="item.raw.flag" :alt="item.raw.name" />
                                </v-avatar>
                            </template>
                            <v-list-item-title>
                                {{ item.raw.name }} (+{{ item.raw.dialCode }})
                            </v-list-item-title>
                        </v-list-item>
                    </template>
                    <template #selection="{ item }">
                        <div class="d-flex align-center w-100">
                            <img
                                :src="item.raw.flag"
                                :alt="item.raw.name"
                                class="mr-2"
                                style="width: 20px; height: 14px"
                            />
                            <div>+{{ item.raw.dialCode }}</div>
                        </div>
                    </template>
                </v-autocomplete>
            </v-col>
            <v-col cols="7" sm="8">
                <v-text-field
                    v-model="phoneNumber"
                    :label="t('TelNumberInput.phoneNumberLabel')"
                    type="tel"
                    variant="outlined"
                    :rules="[validatePhoneNumber]"
                    @blur="onPhoneNumberBlur"
                />
            </v-col>
        </v-row>
    </div>
</template>

<script setup lang="ts">
import type { CountryCode } from "libphonenumber-js";

import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
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
const selectedCountry = ref<Country>(europeanCountries[0]);
const phoneNumber = ref("");
const countryOptions = ref<Country[]>(europeanCountries);

watch(
    () => modelValue,
    (newVal) => {
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

function onFilterCountries(searchVal = ""): void {
    if (searchVal === "") {
        countryOptions.value = europeanCountries;
        return;
    }
    const needle = searchVal.toLowerCase();
    countryOptions.value = europeanCountries.filter(
        (country) =>
            country.name.toLowerCase().includes(needle) ||
            country.dialCode.includes(needle) ||
            country.iso2.toLowerCase().includes(needle),
    );
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
        if (!country) return t("TelNumberInput.selectCountryCodeValidationMsg");
    } else if (number && !country) {
        return t("TelNumberInput.selectCountryCodeValidationMsg");
    }
    return true;
}

function validatePhoneNumber(): boolean | string {
    const country = selectedCountry.value;
    const number = phoneNumber.value;
    if (required) {
        if (!country || !number) return t("TelNumberInput.provideCountryAndNumberValidationMsg");
    } else {
        if (!country && !number) return true;
        if ((country && !number) || (!country && number)) {
            return t("TelNumberInput.provideCountryAndNumberValidationMsg");
        }
    }
    if (!country) return t("TelNumberInput.selectCountryCodeValidationMsg");
    const phoneNumberObj = parsePhoneNumberFromString(fullNumber.value);
    if (!phoneNumberObj?.isValid()) {
        return t("TelNumberInput.invalidPhoneNumberValidationMsg");
    }

    return true;
}

watch([selectedCountry, phoneNumber], emitPhoneNumber);
</script>
