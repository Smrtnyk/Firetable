import { ActionContext } from "vuex";
import { EventsState, State } from "src/store/types";

export default {
    namespaced: true,
    state: {
        showCreateEventModal: false,
        showEventGuestListDrawer: false,
        showEventInfoModal: false,
    },
    mutations: {
        SET_EVENT_GUEST_LIST_DRAWER_VISIBILITY: (state: EventsState) => {
            state.showEventGuestListDrawer = !state.showEventGuestListDrawer;
        },
        TOGGLE_EVENT_INFO_MODAL_VISIBILITY: (state: EventsState) => {
            state.showEventInfoModal = !state.showEventInfoModal;
        },
    },
};
