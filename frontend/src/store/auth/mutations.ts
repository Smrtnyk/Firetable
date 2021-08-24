import { AuthState } from "src/store/types";
import { User } from "src/types";

interface AuthStatePayload {
    isReady: boolean;
    isAuthenticated: boolean;
    unsubscribeUserWatch: () => void;
}

export function TOGGLE_CREATE_USER_DIALOG_VISIBILITY(state: AuthState) {
    state.showCreateUserDialog = !state.showCreateUserDialog;
}

export function setUser(state: AuthState, user: User) {
    state.user = user;
}

export function setAuthState(
    state: AuthState,
    { isReady, isAuthenticated, unsubscribeUserWatch }: AuthStatePayload
) {
    state.isAuthenticated = isAuthenticated;
    state.isReady = isReady;
    state.unsubscribeUserWatch = unsubscribeUserWatch;
}
