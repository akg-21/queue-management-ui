import api from "./api";

export const getQueue = () => {
    return api.get("/queue");
};

export const callNext = () => {
    return api.get("/queue/call-next");
};

export const skipCurrent = () => {
    return api.get("/queue/skip");
};

export const completeCurrent = () => {
    return api.get("/queue/complete");
};
