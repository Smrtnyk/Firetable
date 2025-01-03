export default {
    Global: {
        fullScreen: "Vollbild",
        edit: "Bearbeiten",
        transfer: "Übertragen",
        copy: "Kopieren",
        delete: "Löschen",
        cancel: "Abbrechen",
        link: "Verknüpfen",
        name: "Name",
        type: "Typ",
        category: "Kategorie",
        actions: "Aktionen",
        price: "Preis",
        submit: "Absenden",
        reset: "Zurücksetzen",
        manageInventoryLink: "Inventar verwalten",
        tagsLabel: "Schlagworte",
        reactivate: "Wiederherstellen",
        arrived: "Eingetroffen",
        cancelled: "Storniert",
        active: "Aktiv",
        inactive: "Inaktiv",
        noDescription: "Keine Beschreibung",
    },
    useReservations: {
        cancelTableOperationTitle: "Vorgang abbrechen",
        cancelTableOperationMsg: "Möchten Sie den aktuellen Vorgang wirklich abbrechen?",
        movingReservationOperationMsg: "Reservierung wird von der Warteliste verschoben",
        copyingReservationOperationMsg: "Kopiere Reservierung von Tisch {tableLabel}",
        transferringReservationOperationMsg: "Verschiebe Reservierung von Tisch {tableLabel}",
        reservationUpdatedMsg: "Reservierung aktualisiert!",
        deleteReservationTitle: "Reservierung löschen?",
        reservationAlreadyReserved: "Dieser Tisch wurde bereits von jemand anderem reserviert.",
        moveReservationToQueueConfirmTitle:
            "Möchten Sie diese Reservierung wirklich in die Warteschlange verschieben?",
        transferReservationConfirmTitle: "Reservierung verschieben?",
        transferReservationConfirmMessage:
            "Reservierung wird von Tisch {table1Label} zu Tisch {table2Label} verschoben. Fortfahren?",
        crossFloorTransferReservationConfirmMessage: `Reservierung wird von Grundriss "{floor1Name}" (Tisch {table1Label}) zu Grundriss "{floor2Name}" (Tisch {table2Label}) verschoben. Fortfahren?`,
        transferToSameTableErrorMsg:
            "Die Reservierung kann nicht zum gleichen Tisch verschoben werden",
        copyToSameTableErrorMsg: "Die Reservierung kann nicht zum gleichen Tisch kopiert werden",
        copyToReservedTableErrorMsg: "Der Zieltisch ist bereits reserviert",
        copyReservationConfirmMsg:
            "Reservierung von Tisch {sourceTableLabel} zu Tisch {targetTableLabel} kopieren?",
        reservationCopyErrorMsg: "Beim Kopieren der Reservierung ist ein Fehler aufgetreten",
        linkTableTitle: "Tische verbinden",
        linkTableConfirmMsg: "Möchten Sie folgende Tische verbinden: {tablesToLink}?",
        tableAlreadyLinkedErrorMsg: "Dieser Tisch ist bereits mit der Reservierung verbunden",
        linkToReservedTableErrorMsg:
            "Der Tisch hat bereits eine Reservierung und kann nicht verbunden werden",
        linkingTableOperationMsg: "Verbinde Tische mit Reservierung: {tableLabels}",
        unlinkConfirmTitle: "Tischverbindung aufheben",
        unlinkConfirmMessage: "Möchten Sie die Verbindung zu Tisch {table} wirklich aufheben?",
        crossFloorLinkErrorMsg:
            "Tische können nicht zwischen verschiedenen Grundrissen verbunden werden",
    },
    validation: {
        required: "Bitte geben Sie etwas ein.",
        noWhiteSpaces: "Keine Leerzeichen erlaubt!",
        passwordRequired: "Passwort ist erforderlich.",
        passwordMinLength: "Das Passwort muss mindestens 6 Zeichen lang sein.",
        passwordHasUpperCase: "Das Passwort muss mindestens einen Großbuchstaben enthalten.",
        passwordHasNumbers: "Das Passwort muss mindestens eine Zahl enthalten.",
        passwordHasSymbols:
            "Das Passwort muss mindestens ein Sonderzeichen enthalten (e.g., !, #, etc...)",
        selectAtLeastOneProperty: "Sie müssen mindestens eine Immobilie auswählen!",
        nameMustBeLongerErrorMsg: "Der Name muss mindestens 2 Zeichen lang sein!",
        negativeReservationConsumptionErrorMsg: "Der Mindestverzehr darf nicht negativ sein",
        greaterThanZeroErrorMsg: "Der Wert muss größer als 0 sein",
        nameRequired: "Name ist erforderlich",
        typeRequired: "Typ ist erforderlich",
    },
    FTTimeframeSelector: {
        selectTimeframe: "Zeitraum auswählen",
        openDatePicker: "Datumsauswahl öffnen",
        today: "Heute",
        yesterday: "Gestern",
        last7Days: "Letzte 7 Tage",
        last30Days: "Letzte 30 Tage",
        custom: "Benutzerdefiniert",
        selectDateRange: "Datumsbereich auswählen",
        clear: "Löschen",
        cancel: "Abbrechen",
        apply: "Anwenden",
        errorSelectDates: "Bitte wählen Sie sowohl Start- als auch Enddatum aus.",
        errorMaxDays: "Der Datumsbereich darf {maxDays} Tage nicht überschreiten.",
        invalidPreset: "Ungültige Preset-Auswahl.",
    },
    TelNumberInput: {
        countryCodeLabel: "Ländervorwahl",
        phoneNumberLabel: "Telefonnummer",
    },
    EventQueuedReservations: {
        title: "Warteschlange",
        emptyMessage: "Es gibt keine Reservierungen in der Warteschlange.",
        errorMessage: "Fehler beim Abrufen von Reservierungen.",
        addNewReservation: "Neue Reservierung",
    },
    InventoryTable: {
        quantity: "Menge",
        drink: "Getränk",
    },
    AppDrawer: {
        links: {
            logout: "Abmelden",
            manageEvents: "Veranstaltungen verwalten",
            manageFloors: "Grundrisse verwalten",
            manageUsers: "Benutzer verwalten",
            manageGuests: "Gäste verwalten",
            manageProperties: "Immobilien verwalten",
            manageOrganisations: "Organisationen verwalten",
            manageAnalytics: "Analytics verwalten",
            settings: "Einstellungen",
            issueReportsOverview: "Fehlerberichte",
            reportIssue: "Fehler melden",
            manageDrinkCards: "Digitale Getränkekarten",
        },
        toggles: {
            darkMode: "Dunkelmodus umschalten",
            onlineStatus: "Online-Status umschalten",
        },
        languageSelectorLabel: "Sprache",
    },
    EventCard: {
        freeLabel: "Kostenlos",
    },
    PageEvent: {
        eventInfoTitle: "Veranstaltungsinformationen",
        showFloorPlansExpanded: "Grundrisse anzeigen",
        deleteQueuedReservationConfirmMsg: "Reservierung aus der Warteschlange löschen?",
        exportReservationsConfirmMsg: "Reservierungen exportieren?",
    },
    EventGuestSearch: {
        label: "Tische nach Gastnamen durchsuchen...",
    },
    EventInfo: {
        eventInfoEmptyMsg: "Es gibt keine Informationen zu dieser Veranstaltung.",
    },
    EventGuestList: {
        deleteGuestTitle: "Möchten Sie diesen Gast wirklich von der Gästeliste entfernen?",
        guestLimitReached: "Limit erreicht!",
        addGuestLabel: "Gast hinzufügen",
        title: "Gästeliste",
        guestListEmptyMessage: "Die Gästeliste ist leer",
    },
    EventGuestListCreateGuestForm: {
        guestNameLabel: "Gastname *",
        guestNameValidationLength: "Der Name muss mindestens 3 Zeichen haben!",
    },
    EventCreateForm: {
        noFloorPlansMessage:
            "Sie können keine Veranstaltungen erstellen, da Sie keine Grundrisse erstellt haben!",
        noChosenFloorsMessage: "Sie müssen mindestens einen Grundriss auswählen",
        selectedFloorNotFoundMessage: "Ausgewählter Grundriss nicht gefunden.",
        goToFloorPlannerMessage: "Zum Grundrissplaner gehen",
        eventImgInputLabel: "Optionale URL des Veranstaltungsbildes",
        eventNameInputLabel: "Veranstaltungsname*",
        guestListLimitInputLabel: "Limit für Gästeliste",
        entryPriceInputLabel: "Eintrittspreis, bei kostenlosem Eintritt 0 eingeben",
        inputDateTimePickerCloseBtnLabel: "Schließen",
        inputDateTimeLabel: "Datum und Uhrzeit der Veranstaltung",
    },
    EventShowReservation: {
        title: "Tisch",
        guestNameLabel: "Name des Gastes",
        numberOfPeopleLabel: "Anzahl der Personen",
        contactLabel: "Kontakt",
        noteLabel: "Notiz",
        reservedByLabel: "Reserviert von",
        createdByLabel: "Ersteller",
        createdAtLabel: "Erstellt am",
        groupedWithLabel: "Gruppiert mit",
        pendingLabel: "Ausstehend",
        reservationGuestArrivedLabel: "Gast ist eingetroffen",
        reservationConfirmedLabel: "Reservierung bestätigt",
        reservationConsumption: "Flaschenkonsum",
        timeLabel: "Ankunftszeit",
        waitingForResponse: "Warte auf Rückmeldung",
        guestHistoryLabel: "Gästehistorie",
        unlinkTablesLabel: "Tischverbindung aufheben",
        linkTablesLabel: "Tische verbinden",
        moveToQueueLabel: "In die Warteschlange verschieben",
    },
    PlannedReservationForm: {
        reservedByStaffRadioBtnLabel: "Personal",
    },
    WalkInReservationForm: {
        optionalGuestNameLabel: "Name des Gastes (optional)",
    },
    EventCreateReservation: {
        title: "Tisch",
        reservationGuestName: "Name des Gastes *",
        reservationNumberOfGuests: "Anzahl der Gäste *",
        reservationGuestContact: "Kontakt des Gastes",
        reservationNote: "Notiz",
        reservationConsumption: "Mindestverzehr",
        reservationTime: "Ankunftszeit",
        reservedByLabel: "Reserviert von",
        requireReservedBySelectionError: "Sie müssen mindestens eine Option auswählen",
        reservedBySocialLabel: "Soziale Netzwerke",
        reservationVIP: "VIP-Status",
    },
    AddNewGuestForm: {
        guestNameInputLabel: "Gastname *",
    },
    PageAdminGuest: {
        upcomingChipLabel: "Anstehend",
        editGuestConfirmMsg: "Möchten Sie die Gästeinformationen von {name} bearbeiten?",
        editGuestDialogTitle: "Gast bearbeiten: {name}",
        deleteGuestConfirmTitle: "Gast löschen?",
        deleteGuestConfirmMessage: "Sind Sie sicher, dass Sie den Gast {name} löschen möchten?",
        noVisitsMessage: "Es gibt keine Besuche für diesen Gast.",
        lastModifiedLabel: "Zuletzt geändert",
        editVisitTitle: "Besuchsdetails bearbeiten",
    },
    PageAdminGuests: {
        title: "Gäste",
        noGuestsData: "Es gibt keine Gäste.",
        maxAmountGuestsCreationMessage:
            "Sie haben die maximale Anzahl an Gästen erreicht, welche {limit} beträgt!",
        createNewGuestDialogTitle: "Neuen Gast erstellen",
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
            "Sie müssen zuerst eine Organisation erstellen, bevor Sie Immobilien anlegen können.",
        createPropertyDialogTitle: "Neue Immobilie hinzufügen",
        editPropertyDialogTitle: "Immobilie bearbeiten: {name}",
    },
    AddNewPropertyForm: {
        propertyNameLengthValidationMessage: "Der Immobilienname muss mindestens 3 Zeichen haben!",
        organisationsRadioBoxLabel: "Organisationen:",
    },
    PageAdminFloors: {
        title: "Grundrisse",
        noFloorPlansMessage: "Diese Immobilie hat keine Grundrisse.",
        noPropertiesMessage:
            "Sie haben noch keine Immobilien angelegt. Erstellen Sie zunächst eine Immobilie, um Grundrisse anlegen zu können.",
        deleteFloorMessage: "Grundriss löschen?",
        duplicateFloorPlanMessage: `Möchten Sie den Grundriss "{floorName}" wirklich duplizieren?`,
        addNewFloorMessage: "Neuen Grundriss zu {propertyName} hinzufügen",
    },
    PageAdminEvents: {
        title: "Veranstaltungen",
        noPropertiesMessage:
            "Es wurden keine Immobilien erstellt, Veranstaltungen können nicht erstellt werden.",
        pastEventsLabel: "Vergangene Veranstaltungen",
        noEventsMessage: "Es wurden noch keine Veranstaltungen angelegt.",
        deleteEventDialogTitle: "Veranstaltung löschen?",
        eventCreatedNotificationMessage: "Veranstaltung erstellt!",
        createNewEventDialogTitle: "Neue Veranstaltung erstellen",
        editEventDialogTitle: "Veranstaltung bearbeiten: {eventName}",
    },
    PageAdminUsers: {
        title: "Benutzer",
        noUsersCreatedMessage: "Es wurden keine Benutzer erstellt.",
        maxAmountUsersCreationMessage:
            "Sie haben die maximale Anzahl an Benutzern erreicht, welche {limit} beträgt!",
        createNewUserDialogTitle: "Neuen Benutzer erstellen",
        editUserDialogTitle: "Benutzer bearbeiten: {name}",
        editUserConfirmationMessage:
            "Sind Sie sicher, dass Sie den Benutzer {name} bearbeiten möchten?",
    },
    UserCreateForm: {
        noOrganisationsMessage:
            "Sie müssen mindestens eine Organisation erstellt haben, bevor Sie einen Immobilieneigentümer erstellen können!",
        userNameInputLabel: "Name *",
        userNameInputHint: "Name der Person, z.B. Max Mustermann",
        userMailInputLabel: "E-Mail *",
        userMailInputHint: "E-Mail-Benutzername ohne Leerzeichen und Sonderzeichen, z.B. max123",
        userPasswordInputLabel: "Benutzerpasswort *",
        userPasswordInputHint: "Passwort des Benutzers",
        userRoleSelectLabel: "Rolle",
        userRoleSelectHint: "Benutzer eine Rolle zuweisen, standardmäßig ist es Mitarbeiter.",
        userOrganisationSelectLabel: "Organisation",
        userOrganisationSelectHint: "Wählen Sie eine Organisation für diesen Benutzer.",
        usePropertiesCheckboxesTitle: "Immobilien:",
    },
    PageProfile: {
        title: "Profil von {name}",
        nameLabel: "Name: {name}",
        roleLabel: "Rolle: {role}",
        passwordInputPlaceholder: "Neues Passwort eingeben",
        passwordInputEnabledTitle: "Eingabe deaktivieren",
        passwordInputDisabledTitle: "Eingabe aktivieren",
        updatePasswordButtonLabel: "Passwort aktualisieren",
    },
    PageAdminInventory: {
        title: "Inventar",
        createNewInventoryItemDialogTitle: "Neuen Inventarartikel erstellen",
        noItemsMessage: "Es sind keine Artikel im Inventar vorhanden.",
        editInventoryItemDialogTitle: "Inventarartikel bearbeiten: {name}",
        deleteItemConfirmMessage: "Inventarartikel löschen: {name}?",
        importMergeSuccess:
            "Artikel erfolgreich importiert. {count} Artikel hinzugefügt, {updated} aktualisiert",
        importError:
            "Fehler beim Importieren der Artikel. Bitte überprüfen Sie das Dateiformat und versuchen Sie es erneut.",
        itemMainCategory: {
            spirits: "Spirituosen",
            wine: "Wein",
            beer: "Bier",
            "non-alcoholic": "Alkoholfrei",
            "cocktail-components": "Cocktail-Zutaten",
            tobacco: "Tabak",
        },
        bulkDeleteSuccess: "Artikel erfolgreich gelöscht",
        bulkDeleteConfirmMessage: "Sind Sie sicher, dass Sie {count} Artikel löschen möchten?",
    },
    GuestSummaryChips: {
        reservations: "Reservierungen",
        arrived: "Angekommen",
    },
    PageIssueReport: {
        title: "Fehlerberichte",
        createNewIssue: "Fehler melden",
        categoryLabel: "Fehlerkategorie",
        descriptionLabel: "Beschreibung",
        descriptionHint: "Bitte beschreibe den Fehler in der gewünschten Tiefe",
        categories: {
            bug: "Fehler",
            featureRequest: "Feature-Anfrage",
        },
        tooManyReports:
            "Sie können nur {count} Fehlerberichte alle {minutes} Minuten einreichen. Bitte versuchen Sie es später erneut.",
        issueReportedSuccess: "Fehlerbericht erfolgreich eingereicht",
        myIssues: "Meine Fehlerberichte",
        noIssuesMessage: "Sie haben noch keine Fehlerberichte gemeldet",
        editIssue: "Fehlerbericht bearbeiten",
        issueUpdateSuccess: "Fehlerbericht erfolgreich aktualisiert",
        deleteConfirmation: "Fehlerbericht wirklich löschen?",
        issueDeleted: "Fehlerbericht erfolgreich gelöscht",
    },
    PageAdminIssueReports: {
        title: "Fehlerberichte",
        noIssuesMessage: "Es gibt keine Fehlerberichte.",
        status: {
            new: "Neu",
            in_progress: "In Bearbeitung",
            resolved: "Gelöst",
            wont_fix: "Nicht beheben",
        },
        updateStatus: "Status aktualisieren",
        statusUpdated: "Fehlerstatus aktualisiert",
        issueMarkedAsResolved: "Fehler als gelöst markiert",
        issueMarkedAsUnresolved: "Fehler als nicht gelöst markiert",
        deleteConfirmation: "Fehlerbericht löschen?",
    },
    PageAdminPropertyDrinkCards: {
        title: "Digitale Getränkekarten",
        noCardsMessage:
            "Noch keine Getränkekarten erstellt. Klicken Sie auf +, um Ihre erste Getränkekarte zu erstellen.",
        createCardDialogTitle: "Neue Getränkekarte erstellen",
        editCardDialogTitle: "Getränkekarte bearbeiten",
        cardCreatedMessage: "Getränkekarte erfolgreich erstellt",
        cardUpdatedMessage: "Getränkekarte erfolgreich aktualisiert",
        cardDeletedMessage: "Getränkekarte erfolgreich gelöscht",
        deleteCardConfirmation: "Möchten Sie diese Getränkekarte wirklich löschen?",
        sectionsLabel: "Bereiche",
        sectionsCount: "Bereiche: {count}",
        noItemsMessage:
            "In diesem Bereich sind noch keine Artikel hinzugefügt. Klicken Sie auf +, um einen Artikel hinzuzufügen.",
        cardNameLabel: "Kartenname",
        cardDescriptionLabel: "Beschreibung (optional)",
        isActiveLabel: "Aktiv",
        servingSize: "Portionsgröße",
        amount: "Menge",
        unit: "Einheit",
        displayName: "Anzeigename",
        addSection: "Bereich hinzufügen",
        sectionNameLabel: "Bereichsname",
        categoryLabel: "Kategorie",
        servingSizeOptional: "Portionsgröße (optional)",
        qrCodeTitle: "QR-Code",
        qrCodeAlt: "QR-Code der Getränkekarte",
        downloadQRCode: "QR-Code herunterladen",
    },
};
