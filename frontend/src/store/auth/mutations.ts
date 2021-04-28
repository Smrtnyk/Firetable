import { AuthState } from "src/store/auth/state";

interface AuthStatePayload {
    isReady: boolean;
    isAuthenticated: boolean;
}

export function setAuthState(
    state: AuthState,
    { isReady, isAuthenticated }: AuthStatePayload
) {
    state.isAuthenticated = isAuthenticated;
    state.isReady = isReady;
}
