import { useEffect, useState } from "react";
import { getSettings } from "../services/settingsService";

function Settings() {

    const [minutes, setMinutes] = useState(0);
    const [queueStatus, setQueueStatus] = useState(false);

    useEffect(() => {

        getSettings()
            .then((response) => {

                setMinutes(response.data.minutesPerPatient);
                setQueueStatus(response.data.queueStatus);

            });

    }, []);

    return (
        <div>
            <label>Minutes Per Patient</label>

            <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
            />

            <br /><br />

            <label>Queue Open</label>

            <input
                type="checkbox"
                checked={queueStatus}
                onChange={(e) => setQueueStatus(e.target.checked)}
            />
        </div>
    );

}

export default Settings;