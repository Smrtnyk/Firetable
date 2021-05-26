import { User } from "src/types";

export interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | undefined;
    users: User[];
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
