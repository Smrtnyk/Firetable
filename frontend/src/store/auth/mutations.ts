import { AuthState } from "src/store/types";
import { User } from "src/types";

interface AuthStatePayload {
    isReady: boolean;
    isAuthenticated: boolean;
}

export function setUser(state: AuthState, user: User) {
    state.user = user;
}

export function setAuthState(
    state: AuthState,
    { isReady, isAuthenticated }: AuthStatePayload
) {
    state.isAuthenticated = isAuthenticated;
    state.isReady = isReady;
}
