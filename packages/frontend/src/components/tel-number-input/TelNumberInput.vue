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
                label="Country Code"
                :use-input="!selectedCountry"
                @filter="onFilterCountries"
                clearable
                clear-icon="close"
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
                label="Phone Number"
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
import type { Country } from "./european-countries";
import type { AnyFunction } from "@firetable/types";
import type { CountryCode } from "libphonenumber-js";
import europeanCountries from "./european-countries";
import { computed, ref, watch } from "vue";
import { parsePhoneNumberFromString, AsYouType } from "libphonenumber-js";
import { QSelect, QInput } from "quasar";

interface TelNumberInputProps {
    modelValue: string;
}

const props = defineProps<TelNumberInputProps>();
const emit = defineEmits(["update:modelValue"]);
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
    () => props.modelValue,
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
                country.name.toLowerCase().includes(needle) ||
                country.dialCode.includes(needle) ||
                country.iso2.toLowerCase().includes(needle)
            );
        });
    });
}

function validateCountrySelection(): boolean | string {
    // If phone number is provided but country code is missing
    if (phoneNumber.value && !selectedCountry.value) {
        return "Please select a country code";
    }
    return true;
}

function validatePhoneNumber(): boolean | string {
    const country = selectedCountry.value;
    // If both country code and phone number are empty, return true (field is optional)
    if (!country && !phoneNumber.value) {
        return true;
    }

    // If one is provided without the other, return an error
    if ((country && !phoneNumber.value) || (!country && phoneNumber.value)) {
        return "Please provide both country code and phone number";
    }

    if (!country) {
        return "Please select a country code";
    }

    const phoneNumberObj = parsePhoneNumberFromString(fullNumber.value);
    if (!phoneNumberObj?.isValid()) {
        return "Invalid phone number";
    }

    return true;
}

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

watch([selectedCountry, phoneNumber], emitPhoneNumber);
</script>
