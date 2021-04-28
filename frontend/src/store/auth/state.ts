import { User } from "src/types";

export interface AuthState {
    isAuthenticated: boolean;
    isReady: boolean;
    user: User | undefined;
    users: User[];
}

const state: AuthState = {
    isAuthenticated: false,
    isReady: false,
    user: void 0,
    users: [],
};

export default state;
