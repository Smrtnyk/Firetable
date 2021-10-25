import { User } from "src/types/auth";

export interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | undefined;
    users: User[];
    showCreateUserDialog: boolean;
    unsubscribeUserWatch: () => void;
}

export interface EventsState {
    showCreateEventModal: boolean;
    showEventGuestListDrawer: boolean;
    showEventInfoModal: boolean;
}

export interface State {
    auth: AuthState;
    events: EventsState;
}
