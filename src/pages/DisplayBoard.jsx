import { useState, useEffect } from "react";
import { getQueue, callNext, completeCurrent, skipCurrent } from "../services/queueService";

function DisplayBoard() {
    const [queueData, setQueueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [showStaffControls, setShowStaffControls] = useState(false);

    const fetchQueue = async () => {
        try {
            const response = await getQueue();
            setQueueData(response.data);
            setError("");
        } catch (err) {
            console.error("Error fetching queue display", err);
            setError("Failed to load queue details. Is the server running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 10000); // Auto-refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const handleAction = async (apiCall, successMessage) => {
        setActionLoading(true);
        setError("");
        try {
            await apiCall();
            await fetchQueue();
        } catch (err) {
            console.error("Queue action failed", err);
            const errMsg = err.response?.data?.message || "Operation failed.";
            setError(errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !queueData) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <span className="spinner" style={{ width: "3rem", height: "3rem" }}></span>
            </div>
        );
    }

    const current = queueData?.currentlyServing;
    const waiting = queueData?.waitingPatients || [];
    const isOpen = queueData?.queueOpen;

    return (
        <div style={{ width: "100%", maxWidth: "1200px" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1>Clinic Display Board</h1>
                    <p style={{ marginTop: "0.25rem" }}>Live ticket status. Updates every 10s.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {isOpen ? (
                        <span className="badge badge-success">
                            <span className="status-dot pulsing"></span>
                            Queue Open
                        </span>
                    ) : (
                        <span className="badge badge-danger">
                            <span className="status-dot"></span>
                            Queue Closed
                        </span>
                    )}
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => setShowStaffControls(true)}
                        style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                    >
                        Staff controls
                    </button>
                </div>
            </header>

            {error && (
                <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{error}</span>
                </div>
            )}

            <div className="dashboard-grid">
                {/* Now Serving Highlight Panel */}
                <div className="glass-card serving-highlight">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                        <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Now Serving
                        </span>
                        {current ? (
                            <>
                                <div className="serving-number-big">
                                    #{current.tokenNumber}
                                </div>
                                <div className="serving-patient-name">
                                    {current.patientName}
                                </div>
                                <span className="badge badge-success" style={{ marginTop: "1rem" }}>
                                    In Counter Service
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="serving-number-big" style={{ color: "var(--text-muted)", fontSize: "6rem", textShadow: "none" }}>
                                    --
                                </div>
                                <div className="serving-patient-name" style={{ color: "var(--text-muted)" }}>
                                    No patient currently in service
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Waiting Patients List */}
                <div className="glass-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2>Waiting List</h2>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                            {waiting.length} PATIENT{waiting.length !== 1 ? "S" : ""}
                        </span>
                    </div>

                    {waiting.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.5 }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                            <p>Queue is empty. Ready for next patients.</p>
                        </div>
                    ) : (
                        <div className="queue-list-container">
                            {waiting.map((patient, index) => (
                                <div className="queue-item" key={patient.tokenNumber}>
                                    <div className="queue-item-left">
                                        <div className="queue-item-num">
                                            #{patient.tokenNumber}
                                        </div>
                                        <div className="queue-item-name">
                                            {patient.patientName}
                                        </div>
                                    </div>
                                    <div className="queue-item-pos">
                                        {index === 0 ? (
                                            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>Up Next</span>
                                        ) : (
                                            `Position ${index + 1}`
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-out Staff Controls Tray */}
            {showStaffControls && (
                <>
                    <div className="drawer-backdrop" onClick={() => setShowStaffControls(false)}></div>
                    <div className="side-drawer open">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3>Staff Controls</h3>
                            <button 
                                onClick={() => setShowStaffControls(false)}
                                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.25rem" }}
                            >
                                &times;
                            </button>
                        </div>
                        
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            Direct actions to manipulate clinic queue status.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                            <button 
                                className="btn btn-primary" 
                                disabled={actionLoading || !isOpen}
                                onClick={() => handleAction(callNext, "Called next patient.")}
                            >
                                {actionLoading ? <span className="spinner"></span> : "Call Next Patient"}
                            </button>

                            <button 
                                className="btn btn-success" 
                                disabled={actionLoading || !current}
                                onClick={() => handleAction(completeCurrent, "Completed service.")}
                            >
                                {actionLoading ? <span className="spinner"></span> : "Complete Current"}
                            </button>

                            <button 
                                className="btn btn-danger" 
                                disabled={actionLoading || !current}
                                onClick={() => handleAction(skipCurrent, "Skipped patient.")}
                                style={{ backgroundColor: "var(--color-warning)", hover: "var(--color-warning)" }}
                            >
                                {actionLoading ? <span className="spinner"></span> : "Skip (Move to End)"}
                            </button>
                        </div>

                        <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Logged in as Counter Staff.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default DisplayBoard;