import type { TranslationStructure } from "src/i18n/en-GB";

const es: TranslationStructure = {
    AddNewGuestForm: {
        guestNameInputLabel: "Nombre de invitado *",
    },
    AddNewPropertyForm: {
        organisationsRadioBoxLabel: "Organizaciones:",
        propertyNameLengthValidationMessage:
            "¡El nombre de la propiedad debe tener al menos 3 caracteres!",
    },
    AppDrawer: {
        languageSelectorLabel: "Lenguaje",
        links: {
            issueReportsOverview: "Reportes de Problemas",
            logout: "Cerrar sesión",
            manageAnalytics: "Gestionar Analíticas",
            manageDrinkCards: "Gestionar Tarjetas de Bebidas",
            manageEvents: "Gestionar Eventos",
            manageFloors: "Gestionar Pisos",
            manageGuests: "Invitados",
            manageOrganisations: "Gestionar Organizaciones",
            manageProperties: "Gestionar Propiedades",
            manageUsers: "Gestionar Usuarios",
            reportIssue: "Reportar un problema",
            settings: "Configuración",
        },
        toggles: {
            darkMode: "Modo oscuro",
            onlineStatus: "Estado en línea",
        },
    },
    EventCard: {
        freeLabel: "Gratis",
    },
    EventCreateForm: {
        entryPriceInputLabel: "Precio de entrada, 0 para gratis",
        eventImgInputLabel: "URL de imagen opcional del evento",
        eventNameInputLabel: "Nombre del evento*",
        goToFloorPlannerMessage: "Ir al planificador de pisos",
        guestListLimitInputLabel: "Limite de la lista de invitados",
        inputDateTimeLabel: "Fecha y hora del evento",
        inputDateTimePickerCloseBtnLabel: "Cerrar",
        noChosenFloorsMessage: "Seleccione al menos un plano de piso!",
        noFloorPlansMessage: "¡No puede crear un evento sin planos de piso!",
        selectedFloorNotFoundMessage: "Piso seleccionado no encontrado",
    },
    EventCreateReservation: {
        requireReservedBySelectionError: "Debe seleccionar al menos una opción",
        reservationConsumption: "Consumo",
        reservationGuestContact: "Contacto de invitado",
        reservationGuestName: "Nombre de invitado *",
        reservationNote: "Nota",
        reservationNumberOfGuests: "Cantidad de invitados *",
        reservationTime: "Hora",
        reservationVIP: "VIP?",
        reservedByLabel: "Reservado por",
        reservedBySocialLabel: "Redes sociales",
        title: "Mesa",
    },
    EventGuestList: {
        addGuestLabel: "Añadir invitado",
        deleteGuestTitle: "¿Realmente quiere eliminar a este invitado de la lista?",
        guestLimitReached: "¡Limite alcanzado!",
        guestListEmptyMessage: "La lista de invitados está vacía",
        title: "Lista de invitados",
    },
    EventGuestListCreateGuestForm: {
        guestNameLabel: "Nombre de invitado *",
        guestNameValidationLength: "¡El nombre debe tener al menos 3 caracteres!",
    },
    EventGuestSearch: {
        label: "Buscar mesas por nombre de invitado...",
    },
    EventInfo: {
        eventInfoEmptyMsg: "¡No hay descripción del evento!",
    },
    EventQueuedReservations: {
        addNewReservation: "Añadir nueva reservación",
        emptyMessage: "No existen reservaciones en cola",
        errorMessage: "Error al cargar reservaciones",
        title: "Reservaciones en cola",
    },
    EventShowReservation: {
        contactLabel: "Contacto",
        createdAtLabel: "Creado el",
        createdByLabel: "Creador",
        groupedWithLabel: "Agrupado con",
        guestHistoryLabel: "Historial de invitados",
        guestNameLabel: "Nombre",
        linkTablesLabel: "Vincualar mesas",
        moveToQueueLabel: "Mover a la cola",
        noteLabel: "Nota",
        numberOfPeopleLabel: "Numero de personas",
        pendingLabel: "Pendiente",
        reservationConfirmedLabel: "Confirmado",
        reservationConsumption: "Consumo",
        reservationGuestArrivedLabel: "Llegado",
        reservedByLabel: "Reservado por",
        timeLabel: "Hora de llegada",
        title: "Mesa",
        unlinkTablesLabel: "Desvincular mesas",
        waitingForResponse: "Esperando respuesta",
    },
    FTTimeframeSelector: {
        apply: "Aplicar",
        cancel: "Cancelar",
        clear: "Limpiar",
        custom: "Personalizado",
        errorMaxDays: "Rango de fechas no puede ser mayor a {maxDays} días",
        errorSelectDates: "Por favor, selecciona fecha de inicio y fin",
        invalidPreset: "Selección no válida",
        last7Days: "Últimos 7 días",
        last30Days: "Últimos 30 dias",
        openDatePicker: "Abrir selector de fecha",
        selectDateRange: "Seleccionar rango de fechas",
        selectTimeframe: "Seleccionar rango de tiempo",
        today: "Hoy",
        yesterday: "Ayer",
    },
    Global: {
        actions: "Acciones",
        active: "Activo",
        arrived: "Llegado",
        cancel: "Cancelar",
        cancelled: "Cancelado",
        category: "Categoría",
        copy: "Copiar",
        delete: "Eliminar",
        edit: "Editar",
        fullScreen: "Pantalla Completa",
        inactive: "Inactivo",
        link: "Vincular",
        manageInventoryLink: "Gestionar inventario",
        name: "Nombre",
        noDescription: "Sin descripción",
        price: "Precio",
        reactivate: "Reactivar",
        reset: "Reiniciar",
        submit: "Enviar",
        tagsLabel: "Etiquetas",
        transfer: "Transferir",
        type: "Tipo",
    },
    GuestSummaryChips: {
        arrived: "Llegado",
        reservations: "Reservaciones",
    },
    InventoryItemCreateForm: {
        alcoholContentRange: "Alcohol content must be between 0 and 100",
        mainCategoryRequired: "Main category is required",
        minimumStockNonNegative: "Minimum stock must be non-negative",
        quantityNonNegative: "Quantity must be non-negative",
        subCategoryRequired: "Sub category is required",
        volumePositive: "Volume must be positive",
    },
    InventoryTable: {
        actions: "Acciones",
        deleteSelected: "Eliminar selecciones",
        drink: "Bebida",
        mainCategory: "Categoría principal",
        quantity: "Cantidad",
        subCategory: "Subcategoría",
        supplier: "Proveedor",
        volume: "Volumen",
    },
    PageAdminEvents: {
        createNewEventDialogTitle: "Crear nuevo evento",
        deleteEventDialogTitle: "¿Eliminar evento?",
        editEventDialogTitle: "Editando evento: {eventName}",
        eventCreatedNotificationMessage: "¡Evento creado!",
        noEventsMessage: "No hay eventos creados",
        noPropertiesMessage: "There are no properties created, cannot create events.",
        pastEventsLabel: "Eventos anteriores",
        title: "Events",
    },
    PageAdminFloors: {
        addNewFloorMessage: "Anadir nuevo piso a {propertyName}",
        deleteFloorMessage: "¿Eliminar piso?",
        duplicateFloorPlanMessage: "Esta seguro que desea duplicar el plano de piso {floorName}?",
        noFloorPlansMessage: "Esta propiedad no tiene planos de piso",
        noPropertiesMessage:
            "No tiene propiedades creadas, para crear planos de piso debe crear al menos una propiedad.",
        title: "Planos de piso",
    },
    PageAdminGuest: {
        deleteGuestConfirmMessage: "¿Estás seguro de que quieres eliminar al invitado {name}?",
        deleteGuestConfirmTitle: "¿Eliminar invitado?",
        editGuestConfirmMsg: "¿Estás seguro de que quieres editar a invitado {name}?",
        editGuestDialogTitle: "Editando invitado: {name}",
        editVisitTitle: "Editar detalles de visita",
        lastModified: "Modificado por última vez",
        noVisitsMessage: "No hay visitas registradas para este invitado",
        upcomingChipLabel: "Próximos",
    },
    PageAdminGuests: {
        createNewGuestDialogTitle: "Crear nuevo invitado",
        maxAmountGuestsCreationMessage:
            "¡Ha llegado al máximo de invitados que puede crear, que es {limit}!",
        noGuestsData: "Sin datos de invitados",
        title: "Invitados",
    },
    PageAdminInventory: {
        bulkDeleteConfirmMessage: "¿Esta seguro que desea eliminar {count} articulos?",
        bulkDeleteSuccess: "Artículos eliminados correctamente",
        createNewInventoryItemDialogTitle: "Crear un nuevo artículo de inventario",
        deleteItemConfirmMessage: "¿Eliminar artículo de inventario: {name}?",
        editInventoryItemDialogTitle: "Editando artículo de inventario: {name}",
        importError:
            "Error al importar artículos. Por favor, revise el formato del archivo e intente nuevamente.",
        importMergeSuccess:
            "Artículos importados correctamente. {Count} artículos añadidos, {updated} actualizados.",
        itemMainCategory: {
            beer: "Cerveza",
            "cocktail-components": "Cocktail Components",
            "non-alcoholic": "Non-alcoholic",
            spirits: "Licor",
            tobacco: "Tabaco",
            wine: "Vino",
        },
        noItemsMessage: "No hay artículos en el inventario.",
        title: "Inventario",
    },
    PageAdminIssueReports: {
        deleteConfirmation: "Elimnar reporte",
        issueMarkedAsResolved: "Reporte marcado como resuelto",
        issueMarkedAsUnresolved: "Reporte marcado como no resuelto",
        noIssuesMessage: "No se han reportado problemas",
        status: {
            in_progress: "En Progreso",
            new: "Nuevo",
            resolved: "Resuelto",
            wont_fix: "No Se Arreglará",
        },
        statusUpdated: "Estado de Reporte Actualizado",
        title: "Reportes de Problemas",
        updateStatus: "Actualizar Estado",
    },
    PageAdminProperties: {
        addNewProperty: "Añadir nueva propiedad",
        createPropertyDialogTitle: "Añadir nueva propiedad",
        deletePropertyDialogMessage: "¡Esto eliminará todos los eventos asociados!",
        deletePropertyDialogTitle: "¿Eliminar propiedad?",
        editPropertyDialogTitle: "Editando propiedad: {name}",
        maxAmountOfPropertiesReachedMessage: "¡Ha alcanzado el máximo de propiedades creadas!",
        noPropertiesCreatedMessage: "No hay propiedades creadas",
        noPropertiesWithoutOrganisationMessage:
            "Para crear propiedades, debe primero crear una organización.",
        properties: "Propiedades",
    },
    PageAdminPropertyDrinkCards: {
        addSection: "Añadir sección",
        amount: "Cantidad",
        cardCreatedMessage: "Tarjeta de bebidas creada con éxito",
        cardDeletedMessage: "Tarjeta de bebidas eliminada con éxito",
        cardDescriptionLabel: "Descripción (opcional)",
        cardNameLabel: "Nombre de Tarjeta",
        cardUpdatedMessage: "Tarjeta de bebidas actualizada con éxito",
        categoryLabel: "Categoría",
        createCardDialogTitle: "Crear Nueva Tarjeta de Bebidas",
        deleteCardConfirmation: "Are you sure you want to delete this drink card?",
        displayName: "Nombre a mostrar",
        downloadQRCode: "Descargar código QR",
        editCardDialogTitle: "Editar Tarjeta de Bebidas",
        isActiveLabel: "Activo",
        noCardsMessage:
            "No hay tarjetas de bebida digitales creadas. Haz clic en el botón + crear tu primera tarjeta.",
        noItemsMessage: "No hay artículos en esta sección. Haz clic en el botón + para añadir uno.",
        qrCodeAlt: "Código QR de la tarjeta de bebidas",
        qrCodeTitle: "Código QR",
        sectionNameLabel: "Nombre de sección",
        sectionsCount: "Secciones: {count}",
        sectionsLabel: "Secciones",
        servingSize: "Tamaño de Porción",
        servingSizeOptional: "Serving Size (Optional)",
        title: "Tarjetas de Bebida Digitales",
        unit: "Unidad",
    },
    PageAdminUsers: {
        createNewUserDialogTitle: "Crear nuevo usuario",
        editUserConfirmationMessage: "Esta seguro que desea editar al usuario {name}?",
        editUserDialogTitle: "Editando usuario: {name}",
        maxAmountUsersCreationMessage: "¡Ha alcanzado el máximo de usuarios, que es {limit}!",
        noUsersCreatedMessage: "No hay usuarios creados.",
        title: "Usuarios",
    },
    PageEvent: {
        deleteQueuedReservationConfirmMsg: "¿Está seguro que desea eliminar esta reservación?",
        eventInfoTitle: "Información del evento",
        exportReservationsConfirmMsg: "Esto exportará todas las reservaciones a un archivo CSV",
        showFloorPlansExpanded: "Planos de piso",
    },
    PageIssueReport: {
        categories: {
            bug: "Bug",
            feature_request: "Solicitar una nueva función",
        },
        categoryLabel: "Categoría del problema",
        createNewIssue: "Reportar nuevo problema",
        deleteConfirmation: "¿Está seguro de que desea eliminar este reporte?",
        descriptionHint: "Por favor, describa detalladamente el problema",
        descriptionLabel: "Descripción",
        editIssue: "Editar reporte",
        issueDeleted: "Reporte eliminado exitosamente",
        issueReportedSuccess: "Se ha reportado el problema exitosamente",
        issueUpdateSuccess: "Reporte actualizado exitosamente",
        myIssues: "Mis reportes",
        noIssuesMessage: "No ha reportado ningún problema",
        title: "Reportes de Problemas",
        tooManyReports:
            "Solo puede enviar {count} reportes cada {minutes} minutos. Intentelo de nuevo más tarde.",
    },
    PageProfile: {
        nameLabel: "Nombre: {name}",
        passwordInputDisabledTitle: "Habilitar entrada",
        passwordInputEnabledTitle: "Deshabilitar entrada",
        passwordInputPlaceholder: "Ingrese una nueva contraseña",
        roleLabel: "Rol: {role}",
        title: "Perfil de {name}",
        updatePasswordButtonLabel: "Actualizar Contraseña",
    },
    PlannedReservationForm: {
        reservedByStaffRadioBtnLabel: "Staff",
    },
    TelNumberInput: {
        countryCodeLabel: "Código de país",
        phoneNumberLabel: "Número Celular",
    },
    UserCreateForm: {
        noOrganisationsMessage:
            "¡Debe crear al menos una organización antes de crear al dueño de la propiedad!",
        usePropertiesCheckboxesTitle: "Propiedades:",
        userMailInputHint:
            "Nombre de usuario email sin espacios y caracteres especiales, ejemplo, max123",
        userMailInputLabel: "Email *",
        userNameInputHint: "Nombre de la persona, ejemplo, Max Mustermann",
        userNameInputLabel: "Nombre *",
        userOrganisationSelectHint: "Seleccione la organización a la que pertenece el usuario",
        userOrganisationSelectLabel: "Organización",
        userPasswordInputHint: "Contraseña del usuario",
        userPasswordInputLabel: "Contraseña *",
        userRoleSelectHint: "Asignar rol al usuario, el predeterminado es Staff",
        userRoleSelectLabel: "Rol",
    },
    useReservations: {
        cancelTableOperationMsg: "¿Estás seguro de que quieres cancelar esta operación?",
        cancelTableOperationTitle: "Cancelar Operación",
        copyingReservationOperationMsg: "Copiando reservación de la mesa {tableLabel}",
        copyReservationConfirmMsg:
            "¿Copiar reservación de la mesa {sourceTableLabel} a la mesa {targetTableLabel}?",
        copyToReservedTableErrorMsg: "No se puede copiar a una mesa que ya tiene una reservación!",
        copyToSameTableErrorMsg: "No se puede copiar la reservación a la misma mesa!",
        crossFloorLinkErrorMsg: "No se puede vincular mesas en diferentes pisos",
        crossFloorTransferReservationConfirmMessage: `Esto transferirá la reservación de la mesa {table1Label} en piso "{floor1Name} a la mesa {table2Label} en piso "{floor2Name}`,
        deleteReservationTitle: "¿Eliminar Reservación?",
        linkingTableOperationMsg: "Vinculando mesas a reservación: {tableLabels}",
        linkTableConfirmMsg: "¿Está seguro de que desea vincular estas mesas: {tablesToLink}?",
        linkTableTitle: "Vincular Mesa",
        linkToReservedTableErrorMsg: "No se puede vincular a una mesa que ya tiene una reservación",
        moveReservationToQueueConfirmTitle:
            "¿Está seguro de que desea mover esta reservación a la cola?",
        movingReservationOperationMsg: "Moviendo reservación de la cola",
        reservationAlreadyReserved: "Alguien más ya reservó esta mesa",
        reservationCopyErrorMsg: "Error al copiar la reservación, intente nuevamente",
        reservationUpdatedMsg: "¡Reservación actualizada!",
        tableAlreadyLinkedErrorMsg: "Esta mesa ya está vinculada a la reservación",
        transferReservationConfirmMessage:
            "Esto transferirá la reservación de la mesa {table1Label} a la mesa {table2Label}",
        transferReservationConfirmTitle: "Está seguro de que quieres transferir esta reservación?",
        transferringReservationOperationMsg: "Transfiriendo reservación de la mesa {tableLabel}",
        transferToSameTableErrorMsg: "No se puede transferir la reservación a la misma mesa!",
        unlinkConfirmMessage: "Está seguro de que desea desvincular estas mesas: {table}?",
        unlinkConfirmTitle: "Desvincular mesas",
    },
    validation: {
        greaterThanZeroErrorMsg: "Valor debe ser mayor que 0",
        nameMustBeLongerErrorMsg: "¡El nombre debe tener al menos 2 caracteres!",
        nameRequired: "Nombre es requerido",
        negativeReservationConsumptionErrorMsg: "El consumo no puede ser negativo",
        noWhiteSpaces: "No se permiten espacios en blanco",
        passwordHasNumbers: "La contraseña debe incluir al menos un número",
        passwordHasSymbols:
            "La contraseña debe incluir al menos un símbolo (por ejemplo, !, #, etc...)",
        passwordHasUpperCase: "La contraseña debe incluir al menos una letra mayúscula",
        passwordMinLength: "La contraseña debe tener al menos 6 caracteres",
        passwordRequired: "Se requiere contraseña",
        required: "Por favor, rellene este campo",
        selectAtLeastOneProperty: "¡Debes seleccionar al menos una propiedad!",
        typeRequired: "Tipo es requerido",
    },
    WalkInReservationForm: {
        optionalGuestNameLabel: "Nombre de invitado opcional",
    },
};

export default es;
