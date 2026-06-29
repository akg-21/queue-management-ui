import api from "./api";

export const bookToken = (patientName) => {
    return api.post("/token", { patientName });
};

export const getTokenStatus = (tokenNumber) => {
    return api.get(`/token/${tokenNumber}`);
};
