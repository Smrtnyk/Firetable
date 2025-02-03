/**
 * Enum of all Firestore collection names
 * Used for consistent collection path construction
 */
export const enum Collection {
    /**
     * Collection of drink card documents
     */
    DRINK_CARDS = "drinkCards",
    /**
     * Collection of event log documents
     */
    EVENT_LOGS = "eventLogs",
    /**
     * Collection of event documents
     */
    EVENTS = "events",
    /**
     * Collection of floor plan documents
     */
    FLOORS = "floors",
    /**
     * Collection of guest list documents
     */
    GUEST_LIST = "guestList",
    /**
     * Collection of guest documents
     */
    GUESTS = "guests",
    /**
     * Collection of inventory documents
     */
    INVENTORY = "inventory",
    /**
     * Collection of issue report documents
     */
    ISSUE_REPORTS = "issueReports",
    /**
     * Collection of organisation documents
     */
    ORGANISATIONS = "organisations",
    /**
     * Collection of property documents
     */
    PROPERTIES = "properties",
    /**
     * Collection of queued reservation documents
     */
    QUEUED_RESERVATIONS = "queuedReservations",
    /**
     * Collection of reservation documents
     */
    RESERVATIONS = "reservations",
    /**
     * Collection of user documents
     */
    USERS = "users",
}

/**
 * Standard document ID for event logs
 */
export const EVENT_LOGS_DOCUMENT = "logsDocument";
