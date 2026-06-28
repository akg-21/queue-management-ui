import api from "./api";

export const getSettings = () => {
    return api.get("/settings");
};
export const updateMinutes = (minutes) => {
    return api.put("/settings/minutes-per-patient", {
        minutesPerPatient: minutes
    });
};

export const updateStatus = (status) => {
    return api.put("/settings/queue-status", {
        queueStatus: status
    });
};