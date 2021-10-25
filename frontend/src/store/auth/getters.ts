import { AuthState } from "src/store/types";
import { Role } from "src/types/auth";

export function isAdmin(state: AuthState) {
    return !!state.user && state.user.role === Role.ADMIN;
}

export function isLoggedIn(state: AuthState) {
    return !!state.user && !!state.user.email;
}
