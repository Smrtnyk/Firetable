export default {
    Global: {
        fullScreen: "Full Screen",
        edit: "Edit",
        transfer: "Transfer",
        copy: "Copy",
        delete: "Delete",
    },
    AppDrawer: {
        links: {
            logout: "Logout",
            manageEvents: "Manage Events",
            manageFloors: "Manage Floors",
            manageUsers: "Manage Users",
            manageProperties: "Manage Properties",
            manageOrganisations: "Manage Organisations",
            manageAnalytics: "Manage Analytics",
            manageGuests: "Manage Guests",
            settings: "Settings",
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
        noFloorPlansMessage: "You cannot create events because you have no floor plans created!",
        noChosenFloorsMessage: "You need to choose at least one floor plan",
        selectedFloorNotFoundMessage: "Selected floor not found.",
        goToFloorPlannerMessage: "Go to floor planner",
        eventImgInputLabel: "Optional event image url",
        eventNameInputLabel: "Event name*",
        guestListLimitInputLabel: "Guest list limit",
        entryPriceInputLabel: "Entry price, leave 0 if free",
        inputDateTimePickerCloseBtnLabel: "Close",
        submitButtonLabel: "Submit",
        resetButtonLabel: "Reset",
    },
    EventShowReservation: {
        title: "Table",
        guestNameLabel: "Name",
        numberOfPeopleLabel: "Number of people",
        contactLabel: "Contact",
        noteLabel: "Note",
        reservedByLabel: "Reserved by",
        createdByLabel: "Creator",
        groupedWithLabel: "Grouped with",
        guestArrivedLabel: "Arrived",
        reservationConfirmedLabel: "Confirmed",
        deleteReservationLabel: "Delete",
        editReservationLabel: "Edit",
        reservationConsumption: "Consumption",
        timeLabel: "Time of arrival",
        cancel: "Cancel",
        waitingForResponse: "Waiting for response",
    },
    EventCreateReservation: {
        title: "Table",
        reservationGroupWith: "Group with",
        reservationGroupWithHint: "Group multiple tables under the one reservation.",
        reservationGuestName: "Guest name *",
        reservationNumberOfGuests: "Guest count *",
        reservationGuestContact: "Guest contact",
        reservationNote: "Note",
        reservationCreateBtn: "Submit",
        reservationConsumption: "Consumption",
        reservationTime: "Time",
        reservedByLabel: "Reserved by",
        requireReservedBySelectionError: "You need to select at least one option",
        reservedBySocialLabel: "Social Networks",
        reservationVIP: "VIP?",
    },
    PageAdminGuests: {
        title: "Guests",
        noGuestsCreatedMessage: "There are no guests created.",
        maxAmountGuestsCreationMessage:
            "You have reached the maximum amount of guests which is {limit}!",
        createNewGuestDialogTitle: "Create new guest",
        editGuestDialogTitle: "Editing guest: {name}",
        editGuestConfirmationMessage: "Are you sure you want to edit guest {name}?",
        deleteGuestDialogTitle: "Delete guest?",
        deleteGuestConfirmationMessage: "Are you sure you want to delete guest {name}?",
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
        editPropertyDialogTitle: "Editing property: {name}",
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
    PageAdminEvents: {
        title: "Events",
        noPropertiesMessage: "There are no properties created, cannot create events.",
        deleteEventDialogTitle: "Delete Event?",
        eventCreatedNotificationMessage: "Event created!",
        createNewEventDialogTitle: "Create new event",
    },
    PageAdminUsers: {
        title: "Users",
        noUsersCreatedMessage: "There are no users created.",
        maxAmountUsersCreationMessage:
            "You have reached the maximum amount of users which is {limit}!",
        createNewUserDialogTitle: "Create new user",
        editUserDialogTitle: "Editing user: {name}",
        editUserConfirmationMessage: "Are you sure you want to edit user {name}?",
    },
    UserCreateForm: {
        noOrganisationsMessage:
            "You must have at least one organisation created before creating property owner!",
        userNameInputLabel: "Name *",
        userNameInputHint: "Name of the person, e.g. Max Mustermann",
        userMailInputLabel: "Email *",
        userMailInputHint: "Email username without spaces and special characters, e.g. max123",
        userPasswordInputLabel: "User password *",
        userPasswordInputHint: "Password of the user",
        userRoleSelectLabel: "Role",
        userRoleSelectHint: "Assign role to user, default is Staff.",
        userOrganisationSelectLabel: "Organisation",
        userOrganisationSelectHint: "Select organisation for this user.",
        usePropertiesCheckboxesTitle: "Properties:",
        buttonSubmitLabel: "Submit",
        buttonResetLabel: "Reset",
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
