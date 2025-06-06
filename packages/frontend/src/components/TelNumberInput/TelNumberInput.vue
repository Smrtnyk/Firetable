<template>
    <div>
        <div class="row items-start q-gutter-sm justify-between">
            <q-select
                class="col-4"
                rounded
                standout
                v-model="selectedCountry"
                :options="countryOptions"
                option-label="name"
                :label="t('TelNumberInput.countryCodeLabel')"
                :use-input="!selectedCountry"
                @filter="onFilterCountries"
                clearable
                clear-icon="fa fa-close"
                :clear-icon-label="t('TelNumberInput.clearButtonLabel')"
                :rules="[validateCountrySelection]"
            >
                <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                        <q-item-section avatar>
                            <img
                                :src="scope.opt.flag"
                                alt=""
                                class="q-mr-sm"
                                style="width: 20px; height: 14px"
                            />
                        </q-item-section>
                        <q-item-section side>
                            {{ scope.opt.name }} (+{{ scope.opt.dialCode }})
                        </q-item-section>
                    </q-item>
                </template>

                <template #selected-item="{ opt }">
                    <div class="row no-wrap items-center full-width">
                        <img
                            :src="opt.flag"
                            alt=""
                            class="q-mr-sm"
                            style="width: 20px; height: 14px"
                        />
                        <div>+{{ opt.dialCode }}</div>
                    </div>
                </template>
            </q-select>

            <q-input
                class="col"
                v-model="phoneNumber"
                :label="t('TelNumberInput.phoneNumberLabel')"
                type="tel"
                rounded
                standout
                :rules="[validatePhoneNumber]"
                @blur="onPhoneNumberBlur"
            />
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
        // Only update inputs if modelValue has changed and is different from current inputs
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
        // Do not reset inputs when newVal is empty (invalid input)
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
            return t('TelNumberInput.selectCountryCodeValidationMsg');
        }
    } else if (number && !country) {
        return t('TelNumberInput.selectCountryCodeValidationMsg');
    }
    return true;
}

function validatePhoneNumber(): boolean | string {
    const country = selectedCountry.value;
    const number = phoneNumber.value;

    if (required) {
        if (!country || !number) {
            return t('TelNumberInput.provideCountryAndNumberValidationMsg');
        }
    } else {
        if (!country && !number) {
            // Field is optional
            return true;
        }
        if ((country && !number) || (!country && number)) {
            return t('TelNumberInput.provideCountryAndNumberValidationMsg');
        }
    }

    if (!country) {
        return t('TelNumberInput.selectCountryCodeValidationMsg');
    }

    const phoneNumberObj = parsePhoneNumberFromString(fullNumber.value);
    if (!phoneNumberObj?.isValid()) {
        return t('TelNumberInput.invalidPhoneNumberValidationMsg');
    }

    return true;
}

watch([selectedCountry, phoneNumber], emitPhoneNumber);
</script>
