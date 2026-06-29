import { useEffect, useState } from "react";
import { getSettings, updateMinutes, updateStatus } from "../services/settingsService";

function Settings() {
    const [minutes, setMinutes] = useState(5);
    const [queueStatus, setQueueStatus] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const fetchSettings = () => {
        setLoading(true);
        getSettings()
            .then((response) => {
                setMinutes(response.data.minutesPerPatient);
                setQueueStatus(response.data.queueStatus);
                setError("");
            })
            .catch((err) => {
                console.error("Error loading settings", err);
                setError("Failed to load clinic settings from server.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const showTemporarySuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(""), 4000);
    };

    const handleToggleStatus = async (checked) => {
        setSaving(true);
        setError("");
        setSuccessMessage("");
        try {
            await updateStatus(checked);
            setQueueStatus(checked);
            showTemporarySuccess(`Queue status successfully changed to ${checked ? 'Open (Online Booking Active)' : 'Closed (No new tokens)'}.`);
        } catch (err) {
            console.error("Failed to update queue status", err);
            const errMsg = err.response?.data?.message || "Failed to update queue status.";
            setError(errMsg);
            // Revert checkbox state
            setQueueStatus(!checked);
        } finally {
            setSaving(false);
        }
    };

    const handleMinutesChange = async (val) => {
        const parsed = parseInt(val);
        if (isNaN(parsed) || parsed < 1 || parsed > 60) return;
        setMinutes(parsed);
        setSaving(true);
        setError("");
        try {
            await updateMinutes(parsed);
            showTemporarySuccess(`Estimated wait time per patient set to ${parsed} minutes.`);
        } catch (err) {
            console.error("Failed to update minutes per patient", err);
            setError("Failed to save minutes per patient.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
                <span className="spinner" style={{ width: "3rem", height: "3rem" }}></span>
            </div>
        );
    }

    return (
        <div className="mobile-view">
            <header style={{ marginBottom: "2rem" }}>
                <h1>Clinic Settings</h1>
                <p>Configure queue rules, timing intervals, and client scheduling states.</p>
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

            <div className="glass-card">
                <h2 style={{ marginBottom: "1.5rem" }}>Queue Parameters</h2>

                <div className="settings-card-action">
                    <div>
                        <h3 style={{ fontSize: "1.1rem" }}>Queue Door Control</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                            Open/Close ticket registration. When closed, new patients cannot request tokens.
                        </p>
                    </div>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={queueStatus}
                            onChange={(e) => handleToggleStatus(e.target.checked)}
                            disabled={saving}
                        />
                        <span className="slider"></span>
                    </label>
                </div>

                <div style={{ marginTop: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "1.1rem" }}>Minutes Per Patient</h3>
                        <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-accent)" }}>
                            {minutes}m
                        </span>
                    </div>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 1.25rem" }}>
                        Adjust the average consultation time per patient to calibrate estimated wait times.
                    </p>

                    <div className="settings-slider-wrapper">
                        <input
                            type="range"
                            min="1"
                            max="30"
                            value={minutes}
                            onChange={(e) => handleMinutesChange(e.target.value)}
                            disabled={saving}
                            className="range-input"
                        />
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "-0.5rem" }}>
                        <span>Fast (1 min)</span>
                        <span>Standard (5 mins)</span>
                        <span>Detailed (30 mins)</span>
                    </div>
                </div>
            </div>


        </div>
    );
}

export default Settings;