import { BrowserRouter, Routes, Route } from "react-router-dom";

import Patient from "./pages/Patient";
import Reception from "./pages/Reception";
import DisplayBoard from "./pages/DisplayBoard";
import Settings from "./pages/Settings";
import Navigation from "./components/Navigation";

function App() {
    return (
        <BrowserRouter>
            <Navigation />
            <div className="app-container">
                <Routes>
                    <Route path="/" element={<Patient />} />
                    <Route path="/reception" element={<Reception />} />
                    <Route path="/display" element={<DisplayBoard />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;