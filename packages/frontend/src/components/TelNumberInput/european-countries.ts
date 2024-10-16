export interface Country {
    name: string;
    iso2: string;
    dialCode: string;
    flag: string;
}

const europeanCountries: Country[] = [
    { name: "Austria", iso2: "at", dialCode: "43", flag: "https://flagcdn.com/at.svg" },
    { name: "Belgium", iso2: "be", dialCode: "32", flag: "https://flagcdn.com/be.svg" },
    { name: "Bulgaria", iso2: "bg", dialCode: "359", flag: "https://flagcdn.com/bg.svg" },
    { name: "Croatia", iso2: "hr", dialCode: "385", flag: "https://flagcdn.com/hr.svg" },
    { name: "Cyprus", iso2: "cy", dialCode: "357", flag: "https://flagcdn.com/cy.svg" },
    { name: "Czech Republic", iso2: "cz", dialCode: "420", flag: "https://flagcdn.com/cz.svg" },
    { name: "Denmark", iso2: "dk", dialCode: "45", flag: "https://flagcdn.com/dk.svg" },
    { name: "Estonia", iso2: "ee", dialCode: "372", flag: "https://flagcdn.com/ee.svg" },
    { name: "Finland", iso2: "fi", dialCode: "358", flag: "https://flagcdn.com/fi.svg" },
    { name: "France", iso2: "fr", dialCode: "33", flag: "https://flagcdn.com/fr.svg" },
    { name: "Germany", iso2: "de", dialCode: "49", flag: "https://flagcdn.com/de.svg" },
    { name: "Greece", iso2: "gr", dialCode: "30", flag: "https://flagcdn.com/gr.svg" },
    { name: "Hungary", iso2: "hu", dialCode: "36", flag: "https://flagcdn.com/hu.svg" },
    { name: "Ireland", iso2: "ie", dialCode: "353", flag: "https://flagcdn.com/ie.svg" },
    { name: "Italy", iso2: "it", dialCode: "39", flag: "https://flagcdn.com/it.svg" },
    { name: "Latvia", iso2: "lv", dialCode: "371", flag: "https://flagcdn.com/lv.svg" },
    { name: "Lithuania", iso2: "lt", dialCode: "370", flag: "https://flagcdn.com/lt.svg" },
    { name: "Luxembourg", iso2: "lu", dialCode: "352", flag: "https://flagcdn.com/lu.svg" },
    { name: "Malta", iso2: "mt", dialCode: "356", flag: "https://flagcdn.com/mt.svg" },
    { name: "Netherlands", iso2: "nl", dialCode: "31", flag: "https://flagcdn.com/nl.svg" },
    { name: "Poland", iso2: "pl", dialCode: "48", flag: "https://flagcdn.com/pl.svg" },
    { name: "Portugal", iso2: "pt", dialCode: "351", flag: "https://flagcdn.com/pt.svg" },
    { name: "Romania", iso2: "ro", dialCode: "40", flag: "https://flagcdn.com/ro.svg" },
    { name: "Slovakia", iso2: "sk", dialCode: "421", flag: "https://flagcdn.com/sk.svg" },
    { name: "Slovenia", iso2: "si", dialCode: "386", flag: "https://flagcdn.com/si.svg" },
    { name: "Spain", iso2: "es", dialCode: "34", flag: "https://flagcdn.com/es.svg" },
    { name: "Sweden", iso2: "se", dialCode: "46", flag: "https://flagcdn.com/se.svg" },
    { name: "United Kingdom", iso2: "gb", dialCode: "44", flag: "https://flagcdn.com/gb.svg" },
    { name: "Serbia", iso2: "rs", dialCode: "381", flag: "https://flagcdn.com/rs.svg" },
    { name: "Bosnia", iso2: "ba", dialCode: "387", flag: "https://flagcdn.com/ba.svg" },
    { name: "North Macedonia", iso2: "mk", dialCode: "389", flag: "https://flagcdn.com/mk.svg" },
    { name: "United Kingdom", iso2: "uk", dialCode: "44", flag: "https://flagcdn.com/gb.svg" },
];

export default europeanCountries;
