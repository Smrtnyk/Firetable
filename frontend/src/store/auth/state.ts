import { AuthState } from "src/store/types";
import { NOOP } from "src/helpers/utils";

const state: AuthState = {
    isAuthenticated: false,
    isReady: false,
    user: void 0,
    users: [],
    showCreateUserDialog: false,
    unsubscribeUserWatch: NOOP,
};

export default state;
