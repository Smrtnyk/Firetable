export default {
    AppDrawer: {
        links: {
            logout: "Logout",
            manageEvents: "Manage Events",
            manageFloors: "Manage Floors",
            manageUsers: "Manage Users",
            manageProperties: "Manage Properties",
            manageOrganisations: "Manage Organisations",
        },
        toggles: {
            darkMode: "Toggle dark mode",
            onlineStatus: "Toggle online status",
        },
    },
    EventCard: {
        freeLabel: "Free",
    },
    PageEvent: {
        showFloorPlansExpanded: "Floor plans",
        reservationAlreadyReserved: "Someone else already reserved this table.",
    },
    FTAutocomplete: {
        label: "Search tables by guest name...",
    },
    EventGuestList: {
        deleteGuestTitle: "Do you really want to remove this guest from the guest list?",
        guestLimitReached: "Limit reached!",
        addGuestLabel: "Add Guest",
        title: "Guest List",
        guestListEmptyMessage: "Guest list is empty",
    },
    EventGuestListCreateGuestForm: {
        guestNameLabel: "Guest name *",
        guestNameHint: "Name of the guest",
        guestNameValidationLength: "Name must have at least 3 characters!",
        guestNameAddSubmit: "Submit",
        guestNameReset: "Reset",
    },
    EventCreateForm: {
        noChosenFloorsMessage: "You need to choose at least one floor",
    },
    EventShowReservation: {
        title: "Table",
        guestNameLabel: "Name",
        numberOfPeopleLabel: "Number of people",
        contactLabel: "Contact",
        noteLabel: "Note",
        reservedByLabel: "Reserved by",
        groupedWithLabel: "Grouped with",
        guestArrivedLabel: "Guest arrived?",
        deleteReservationLabel: "Delete Reservation",
    },
    EventCreateReservation: {
        title: "Table",
        reservationGroupWith: "Group with",
        reservationGroupWithHint: "Group multiple tables under the one reservation.",
        reservationGuestName: "Guest name *",
        reservationNumberOfGuests: "Number of persons *",
        reservationGuestContact: "Guest contact",
        reservationNote: "Note",
        reservationCreateBtn: "Create",
    },
    PageAdminProperties: {
        properties: "Properties",
        addNewProperty: "Add new property",
        deletePropertyDialogTitle: "Delete property?",
        deletePropertyDialogMessage: "This will also delete all the associated events!",
        noPropertiesCreatedMessage: "There are no properties created.",
        maxAmountOfPropertiesReachedMessage:
            "You have reached the maximum amount of created properties!",
        noPropertiesWithoutOrganisationMessage:
            "In order to create properties, you must first create an organisation.",
        createPropertyDialogTitle: "Add new Property",
    },
    AddNewPropertyForm: {
        propertyNameLengthValidationMessage: "Property name needs to have at least 3 characters!",
        organisationsRadioBoxLabel: "Organisations:",
        addPropertyButtonLabel: "Submit",
    },
    PageAdminFloors: {
        title: "Floor Plans",
        noFloorPlansMessage: "This property has no floor plans.",
        noPropertiesMessage:
            "You have no properties created, in order to create floor plans you need to first create at least one property.",
        deleteFloorMessage: "Delete floor?",
        duplicateFloorPlanMessage: "Are you sure you want to duplicate {floorName} floor plan?",
        addNewFloorMessage: "Add New Floor to {propertyName}",
    },
    PageProfile: {
        title: "Profile of {name}",
        nameLabel: "Name: {name}",
        roleLabel: "Role: {role}",
        passwordInputPlaceholder: "Enter new password",
        passwordInputEnabledTitle: "Disable input",
        passwordInputDisabledTitle: "Enable input",
        updatePasswordButtonLabel: "Update Password",
    },
};
