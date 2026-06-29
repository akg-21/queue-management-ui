import { useState, useEffect } from "react";
import { bookToken, getTokenStatus } from "../services/tokenService";

function Patient() {
    const [patientName, setPatientName] = useState("");
    const [savedTokenNumber, setSavedTokenNumber] = useState(() => {
        return localStorage.getItem("patient_token_number") 
            ? parseInt(localStorage.getItem("patient_token_number")) 
            : null;
    });
    const [tokenDetails, setTokenDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Helper: format today's date as dd-MM-yyyy
    const getFormattedToday = () => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = today.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    };

    // Load and poll token status
    useEffect(() => {
        if (!savedTokenNumber) {
            setTokenDetails(null);
            return;
        }

        const fetchStatus = async () => {
            try {
                const response = await getTokenStatus(savedTokenNumber);
                const data = response.data;
                
                // Reset token if it is from a previous day
                const todayStr = getFormattedToday();
                if (data.date && data.date !== todayStr) {
                    handleClearToken();
                    return;
                }

                setTokenDetails(data);
                setError("");
            } catch (err) {
                console.error("Error fetching token status", err);
                const errMsg = err.response?.data?.message || "Could not fetch your token status.";
                setError(errMsg);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, [savedTokenNumber]);

    const handleBookToken = async (e) => {
        e.preventDefault();
        if (!patientName.trim()) {
            setError("Please enter your name.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const response = await bookToken(patientName.trim());
            const data = response.data;
            localStorage.setItem("patient_token_number", data.tokenNumber.toString());
            setSavedTokenNumber(data.tokenNumber);
        } catch (err) {
            console.error("Error booking token", err);
            const errMsg = err.response?.data?.message || "Failed to book token. The queue might be closed.";
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleClearToken = () => {
        localStorage.removeItem("patient_token_number");
        setSavedTokenNumber(null);
        setTokenDetails(null);
        setPatientName("");
        setError("");
    };

    const renderStatusBadge = (status) => {
        switch (status?.toUpperCase()) {
            case "WAITING":
                return (
                    <span className="badge badge-warning">
                        <span className="status-dot pulsing"></span>
                        Waiting in Line
                    </span>
                );
            case "SERVING":
                return (
                    <span className="badge badge-success">
                        <span className="status-dot pulsing"></span>
                        In Service Now
                    </span>
                );
            case "COMPLETED":
                return (
                    <span className="badge badge-success" style={{ backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        <span className="status-dot"></span>
                        Service Completed
                    </span>
                );
            case "SKIPPED":
                return (
                    <span className="badge badge-danger">
                        <span className="status-dot pulsing"></span>
                        Skipped (Moved to End)
                    </span>
                );
            default:
                return <span className="badge">{status}</span>;
        }
    };

    return (
        <div className="mobile-view">
            <header style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h1>Clinic Token Booking</h1>
                <p>Register online and track your queue status live</p>
            </header>

            {error && (
                <div className="alert alert-danger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{error}</span>
                </div>
            )}

            {!savedTokenNumber ? (
                <div className="glass-card">
                    <h2 style={{ marginBottom: "1.5rem" }}>Book Your Token</h2>
                    <form onSubmit={handleBookToken}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="patient-name">Your Full Name</label>
                            <input
                                id="patient-name"
                                type="text"
                                className="input-field"
                                placeholder="Enter name to get ticket"
                                value={patientName}
                                onChange={(e) => setPatientName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner"></span> : "Get My Token"}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="glass-card token-card">
                    <div className="token-content">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>PATIENT SLIP</span>
                            {tokenDetails && renderStatusBadge(tokenDetails.status)}
                        </div>

                        <h2 style={{ margin: "0.5rem 0 0" }}>{tokenDetails?.patientName || "Loading..."}</h2>
                        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Token Number</div>
                        
                        <div style={{ position: "relative", display: "inline-block", margin: "1rem 0" }}>
                            <div className="token-large-display">
                                #{savedTokenNumber}
                            </div>
                            <div className="pulse-circle"></div>
                        </div>

                        {tokenDetails && (
                            <>
                                <div className="token-stats-grid">
                                    <div className="token-stat-item">
                                        <span className="token-stat-val">
                                            {tokenDetails.currentlyServing > 0 ? `#${tokenDetails.currentlyServing}` : "-"}
                                        </span>
                                        <span className="token-stat-lbl">Now Serving</span>
                                    </div>
                                    <div className="token-stat-item">
                                        <span className="token-stat-val">
                                            {tokenDetails.status === "SERVING" ? "0" : (tokenDetails.queuePosition ?? "-")}
                                        </span>
                                        <span className="token-stat-lbl">Patients Ahead</span>
                                    </div>
                                </div>

                                <div className="token-stats-grid" style={{ marginTop: "1rem", borderTop: "none" }}>
                                    <div className="token-stat-item" style={{ gridColumn: "span 2" }}>
                                        <span className="token-stat-val" style={{ color: "var(--color-accent)" }}>
                                            {tokenDetails.status === "SERVING" 
                                                ? "It's your turn!" 
                                                : tokenDetails.status === "COMPLETED" 
                                                ? "Service finished" 
                                                : `${tokenDetails.estimatedWaitTime ?? 0} mins`}
                                        </span>
                                        <span className="token-stat-lbl">Estimated Wait Time</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <button 
                            className="btn btn-secondary" 
                            onClick={handleClearToken} 
                            style={{ marginTop: "2rem", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)" }}
                        >
                            Book Another Token
                        </button>
                    </div>
                </div>
            )}
            
            <footer style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Refreshes automatically every 10 seconds. Keep this tab open.
            </footer>
        </div>
    );
}

export default Patient;