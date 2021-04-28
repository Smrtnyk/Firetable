import { Role } from "src/types";
import { AuthState } from "src/store/auth/state";

export function isAdmin(state: AuthState) {
    return !!state.user && state.user.role === Role.ADMIN;
}

export function isLoggedIn(state: AuthState) {
    return !!state.user && !!state.user.email;
}
