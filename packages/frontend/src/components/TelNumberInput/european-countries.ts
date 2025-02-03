export interface Country {
    dialCode: string;
    flag: string;
    iso2: string;
    name: string;
}

const europeanCountries: Country[] = [
    { dialCode: "43", flag: "https://flagcdn.com/at.svg", iso2: "at", name: "Austria" },
    { dialCode: "32", flag: "https://flagcdn.com/be.svg", iso2: "be", name: "Belgium" },
    { dialCode: "359", flag: "https://flagcdn.com/bg.svg", iso2: "bg", name: "Bulgaria" },
    { dialCode: "385", flag: "https://flagcdn.com/hr.svg", iso2: "hr", name: "Croatia" },
    { dialCode: "357", flag: "https://flagcdn.com/cy.svg", iso2: "cy", name: "Cyprus" },
    { dialCode: "420", flag: "https://flagcdn.com/cz.svg", iso2: "cz", name: "Czech Republic" },
    { dialCode: "45", flag: "https://flagcdn.com/dk.svg", iso2: "dk", name: "Denmark" },
    { dialCode: "372", flag: "https://flagcdn.com/ee.svg", iso2: "ee", name: "Estonia" },
    { dialCode: "358", flag: "https://flagcdn.com/fi.svg", iso2: "fi", name: "Finland" },
    { dialCode: "33", flag: "https://flagcdn.com/fr.svg", iso2: "fr", name: "France" },
    { dialCode: "49", flag: "https://flagcdn.com/de.svg", iso2: "de", name: "Germany" },
    { dialCode: "30", flag: "https://flagcdn.com/gr.svg", iso2: "gr", name: "Greece" },
    { dialCode: "36", flag: "https://flagcdn.com/hu.svg", iso2: "hu", name: "Hungary" },
    { dialCode: "353", flag: "https://flagcdn.com/ie.svg", iso2: "ie", name: "Ireland" },
    { dialCode: "39", flag: "https://flagcdn.com/it.svg", iso2: "it", name: "Italy" },
    { dialCode: "371", flag: "https://flagcdn.com/lv.svg", iso2: "lv", name: "Latvia" },
    { dialCode: "370", flag: "https://flagcdn.com/lt.svg", iso2: "lt", name: "Lithuania" },
    { dialCode: "352", flag: "https://flagcdn.com/lu.svg", iso2: "lu", name: "Luxembourg" },
    { dialCode: "356", flag: "https://flagcdn.com/mt.svg", iso2: "mt", name: "Malta" },
    { dialCode: "31", flag: "https://flagcdn.com/nl.svg", iso2: "nl", name: "Netherlands" },
    { dialCode: "48", flag: "https://flagcdn.com/pl.svg", iso2: "pl", name: "Poland" },
    { dialCode: "351", flag: "https://flagcdn.com/pt.svg", iso2: "pt", name: "Portugal" },
    { dialCode: "40", flag: "https://flagcdn.com/ro.svg", iso2: "ro", name: "Romania" },
    { dialCode: "421", flag: "https://flagcdn.com/sk.svg", iso2: "sk", name: "Slovakia" },
    { dialCode: "386", flag: "https://flagcdn.com/si.svg", iso2: "si", name: "Slovenia" },
    { dialCode: "34", flag: "https://flagcdn.com/es.svg", iso2: "es", name: "Spain" },
    { dialCode: "46", flag: "https://flagcdn.com/se.svg", iso2: "se", name: "Sweden" },
    { dialCode: "44", flag: "https://flagcdn.com/gb.svg", iso2: "gb", name: "United Kingdom" },
    { dialCode: "381", flag: "https://flagcdn.com/rs.svg", iso2: "rs", name: "Serbia" },
    { dialCode: "387", flag: "https://flagcdn.com/ba.svg", iso2: "ba", name: "Bosnia" },
    { dialCode: "389", flag: "https://flagcdn.com/mk.svg", iso2: "mk", name: "North Macedonia" },
    { dialCode: "41", flag: "https://flagcdn.com/ch.svg", iso2: "ch", name: "Switzerland" },
];

export default europeanCountries;
