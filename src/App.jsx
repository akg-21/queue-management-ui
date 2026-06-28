import { BrowserRouter, Routes, Route } from "react-router-dom";

import Patient from "./pages/Patient";
import Reception from "./pages/Reception";
import DisplayBoard from "./pages/DisplayBoard";
import Settings from "./pages/Settings";

function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<Patient />} />

                <Route path="/reception" element={<Reception />} />

                <Route path="/display" element={<DisplayBoard />} />

                <Route path="/settings" element={<Settings />} />

            </Routes>

        </BrowserRouter>

    );

}

export default App;