/**
 * Enum of all Firestore collection names
 * Used for consistent collection path construction
 */
export const enum Collection {
    /**
     * Collection of event documents
     */
    EVENTS = "events",
    /**
     * Collection of event log documents
     */
    EVENT_LOGS = "eventLogs",
    /**
     * Collection of reservation documents
     */
    RESERVATIONS = "reservations",
    /**
     * Collection of queued reservation documents
     */
    QUEUED_RESERVATIONS = "queuedReservations",
    /**
     * Collection of guest list documents
     */
    GUEST_LIST = "guestList",
    /**
     * Collection of user documents
     */
    USERS = "users",
    /**
     * Collection of floor plan documents
     */
    FLOORS = "floors",
    /**
     * Collection of organisation documents
     */
    ORGANISATIONS = "organisations",
    /**
     * Collection of property documents
     */
    PROPERTIES = "properties",
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
}

/**
 * Standard document ID for event logs
 */
export const EVENT_LOGS_DOCUMENT = "logsDocument";
