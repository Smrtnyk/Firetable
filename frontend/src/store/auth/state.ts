import { AuthState } from "src/store/types";

const state: AuthState = {
    isAuthenticated: false,
    isReady: false,
    user: void 0,
    users: [],
};

export default state;
