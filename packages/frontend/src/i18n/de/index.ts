export default {
    AppDrawer: {
        links: {
            logout: "Abmelden",
            manageEvents: "Veranstaltungen verwalten",
            manageFloors: "Etagen verwalten",
            manageUsers: "Benutzer verwalten",
            manageProperties: "Immobilien verwalten",
            manageOrganisations: "Organisationen verwalten",
        },
        toggles: {
            darkMode: "Dunkelmodus umschalten",
            onlineStatus: "Online-Status umschalten",
        },
    },
    PageEvent: {
        showMapsExpanded: "Etage anzeigen",
    },
    FTAutocomplete: {
        label: "Tische suchen...",
    },
    EventCreateForm: {
        noChosenFloorsMessage: "Sie müssen mindestens eine Etage auswählen",
    },
    EventShowReservation: {
        title: "Tisch",
        guestNameLabel: "Name des Gastes",
        numberOfPeopleLabel: "Anzahl der Personen",
        contactLabel: "Kontakt",
        noteLabel: "Notiz",
        reservedByLabel: "Reserviert von",
        groupedWithLabel: "Gruppiert mit",
        guestArrivedLabel: "Ist der Gast angekommen?",
    },
    EventCreateReservation: {
        title: "Tisch",
        reservationGroupWith: "Gruppieren mit",
        reservationGroupWithHint: "Mehrere Tische unter einer Reservierung gruppieren.",
        reservationGuestName: "Name des Gastes *",
        reservationNumberOfGuests: "Anzahl der Gäste *",
        reservationGuestContact: "Kontakt des Gastes",
        reservationNote: "Notiz",
        reservationCreateBtn: "Weiter",
    },
    PageAdminProperties: {
        properties: "Immobilien",
        addNewProperty: "Neue Immobilie hinzufügen",
        deletePropertyDialogTitle: "Immobilie löschen?",
        deletePropertyDialogMessage: "Dies wird auch alle zugehörigen Veranstaltungen löschen!",
        noPropertiesCreatedMessage: "Es wurden keine Immobilien erstellt.",
        maxAmountOfPropertiesReachedMessage:
            "Sie haben die maximale Anzahl an erstellten Immobilien erreicht!",
        noPropertiesWithoutOrganisationMessage:
            "Um Immobilien zu erstellen, müssen Sie zuerst eine Organisation erstellen.",
    },
};
