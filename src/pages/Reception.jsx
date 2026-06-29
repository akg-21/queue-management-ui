import { useState, useEffect } from "react";
import { getQueue, callNext, completeCurrent, skipCurrent } from "../services/queueService";
import { getSettings, updateStatus, updateMinutes } from "../services/settingsService";

function Reception() {
    const [queueData, setQueueData] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const fetchData = async () => {
        try {
            const [queueRes, settingsRes] = await Promise.all([
                getQueue(),
                getSettings()
            ]);
            setQueueData(queueRes.data);
            setSettings(settingsRes.data);
            setError("");
        } catch (err) {
            console.error("Error loading reception data", err);
            setError("Could not load queue status. Is the API server running?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const showTemporarySuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    const handleQueueAction = async (actionCall, successLabel) => {
        setActionLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            const response = await actionCall();
            showTemporarySuccess(response.data?.message || successLabel);
            await fetchData();
        } catch (err) {
            console.error("Action error", err);
            const errMsg = err.response?.data?.message || "Operation failed.";
            setError(errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleQueueStatus = async () => {
        if (!settings) return;
        setActionLoading(true);
        setError("");
        setSuccessMessage("");
        try {
            const newStatus = !settings.queueStatus;
            await updateStatus(newStatus);
            showTemporarySuccess(`Queue successfully ${newStatus ? 'Opened' : 'Closed'}.`);
            await fetchData();
        } catch (err) {
            console.error("Error toggling queue status", err);
            const errMsg = err.response?.data?.message || "Failed to change queue status.";
            setError(errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMinutesChange = async (minutes) => {
        if (minutes < 1 || minutes > 60) return;
        setError("");
        try {
            await updateMinutes(minutes);
            setSettings(prev => prev ? { ...prev, minutesPerPatient: minutes } : null);
            showTemporarySuccess(`Minutes per patient updated to ${minutes}m.`);
        } catch (err) {
            console.error("Error updating minutes", err);
            setError("Failed to update minutes per patient.");
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
            <header style={{ marginBottom: "2rem" }}>
                <h1>Reception Console</h1>
                <p>Manage the daily patient token line, process completions, and update clinic configurations.</p>
            </header>

            {successMessage && (
                <div className="alert alert-success">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Quick Metrics Header Row */}
            <div className="dashboard-header-stats">
                <div className="dashboard-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: isOpen ? "var(--color-success-bg)" : "var(--color-danger-bg)", color: isOpen ? "var(--color-success)" : "var(--color-danger)" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{isOpen ? "Open" : "Closed"}</span>
                        <span className="stat-label">Queue Guard</span>
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{waiting.length} Patients</span>
                        <span className="stat-label">Currently Waiting</span>
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-icon-wrapper" style={{ backgroundColor: current ? "var(--color-accent-bg)" : "transparent" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{current ? `#${current.tokenNumber}` : "None"}</span>
                        <span className="stat-label">In Service</span>
                    </div>
                </div>

                <div className="dashboard-stat-card">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{settings?.minutesPerPatient ?? 0}m / patient</span>
                        <span className="stat-label">Pace Est.</span>
                    </div>
                </div>
            </div>

            {/* Main Work Area */}
            <div className="dashboard-grid three-col">
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Active Service Card */}
                    <div className="glass-card">
                        <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                            Active Service
                        </h2>

                        {current ? (
                            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                    Currently Serving
                                </div>
                                <div style={{ fontSize: "4.5rem", fontWeight: 800, color: "var(--color-accent)", margin: "0.5rem 0", textShadow: "0 0 15px var(--color-accent-glow)" }}>
                                    #{current.tokenNumber}
                                </div>
                                <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                                    {current.patientName}
                                </div>

                                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                                    <button 
                                        className="btn btn-success" 
                                        onClick={() => handleQueueAction(completeCurrent, "Completed service for current patient.")}
                                        disabled={actionLoading}
                                        style={{ flex: 1 }}
                                    >
                                        {actionLoading ? <span className="spinner"></span> : "Complete"}
                                    </button>
                                    <button 
                                        className="btn btn-danger" 
                                        onClick={() => handleQueueAction(skipCurrent, "Current patient was skipped and moved to the end of the line.")}
                                        disabled={actionLoading}
                                        style={{ flex: 1, backgroundColor: "var(--color-warning)" }}
                                    >
                                        {actionLoading ? <span className="spinner"></span> : "Skip (To End)"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                                <div style={{ color: "var(--text-muted)", fontSize: "3rem", marginBottom: "1rem" }}>--</div>
                                <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>No patient is currently in service.</p>
                                
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => handleQueueAction(callNext, "Next patient has been called.")}
                                    disabled={actionLoading || !isOpen || waiting.length === 0}
                                    style={{ padding: "1rem 2rem" }}
                                >
                                    {actionLoading ? <span className="spinner"></span> : (
                                        waiting.length === 0 ? "Queue is Empty" : "Call Next Patient"
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Config Card */}
                    {settings && (
                        <div className="glass-card">
                            <h2 style={{ marginBottom: "1.5rem" }}>Quick Configurations</h2>
                            
                            <div className="settings-card-action">
                                <div>
                                    <h3 style={{ fontSize: "1rem" }}>Queue Door Status</h3>
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {isOpen ? "Allow patients to book online" : "Reject online requests"}
                                    </p>
                                </div>
                                <label className="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        checked={settings.queueStatus} 
                                        onChange={handleToggleQueueStatus}
                                        disabled={actionLoading}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="form-group" style={{ margin: "1.5rem 0 0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Minutes Per Patient</label>
                                    <span style={{ fontWeight: 700, color: "var(--color-accent)" }}>{settings.minutesPerPatient}m</span>
                                </div>
                                <div className="settings-slider-wrapper">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={settings.minutesPerPatient}
                                        onChange={(e) => handleMinutesChange(parseInt(e.target.value))}
                                        className="range-input"
                                    />
                                </div>
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "-0.5rem" }}>
                                    Updates estimated wait times on the patient screens instantly.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Waiting Patients List Table */}
                <div className="glass-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2>Waiting List</h2>
                        <span style={{ fontSize: "0.85rem", padding: "0.2rem 0.6rem", background: "var(--color-accent-bg)", color: "var(--color-accent)", borderRadius: "var(--radius-sm)", fontWeight: 600 }}>
                            {waiting.length} WAITING
                        </span>
                    </div>

                    {waiting.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem", opacity: 0.4 }}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                            <p>No waiting patients. Excellent job!</p>
                        </div>
                    ) : (
                        <div className="queue-list-container" style={{ maxHeight: "600px" }}>
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
                                            <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>Calling next...</span>
                                        ) : (
                                            `Queue Position ${index + 1}`
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Reception;