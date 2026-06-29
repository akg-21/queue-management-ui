# Patient Queue Management System - Frontend Client

This repository contains the React + Vite frontend application for the Patient Queue Management System. It provides a live, interactive patient booking slip, a widescreen public TV display board, and a staff console to manage the daily clinic token queue.

---

## Technical Stack
* **Build Tool:** Vite
* **Frontend Library:** React (v19)
* **HTTP Client:** Axios (v1.18)
* **Styling:** Custom CSS Variables & Animations (light/dark mode matching system preferences)
* **Routing:** React Router (v7)

---

## Installation & Setup

### Prerequisites
Make sure you have **Node.js** (v18 or higher recommended) and **npm** installed on your system.

### Steps to Run Locally

1. **Navigate to the frontend directory:**
   ```bash
   cd queue-management-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Port Configuration & CORS Compliance

> [!IMPORTANT]
> The Spring Boot backend has CORS configured to explicitly allow requests **only** from the origin `http://localhost:5173`.
> As defined in `CorsConfig.java` in the backend API:
> ```java
> .allowedOrigins("http://localhost:5173")
> ```

To guarantee that the frontend always runs on port `5173` (preventing silent fallback to other ports if port 5173 is occupied), the Vite server configuration has been set to:
```javascript
server: {
  port: 5173,
  strictPort: true
}
```
If port `5173` is busy when launching the app, the server will throw an error instead of using another port, ensuring API requests never fail due to CORS origin violations.

### API Integration Address
Axios API requests are dispatched to the backend port `8081` as defined in `src/services/api.js`:
```javascript
const api = axios.create({
    baseURL: "http://localhost:8081"
});
```

---

## Screen Routes & Features

### 1. Patient Ticket Booking (`/`)
* **Interface**: Mobile-friendly registration view.
* **Flow**: Patients register their name to get a token. Upon booking, the page locks onto a persistent live status tracker (saved in `localStorage`).
* **Display**: Highlights patient name, token number, estimated wait time, queue status, and the token currently being served.
* **Auto-Reset**: Relies on a daily reset logic. If a saved token is from a previous calendar day, it is automatically cleared to allow booking a new token.

### 2. TV Queue Display Board (`/display`)
* **Interface**: Widescreen-optimized split view designed for clinic TV monitors.
* **Display**:
  * **Now Serving**: Highlights the token number and patient name currently in service inside a large glowing animated panel.
  * **Waiting List**: Lists upcoming patient tokens waiting in line.
* **Staff controls overlay**: Includes a slide-out drawer with action buttons (Call Next, Complete, and Skip) for staff who are interacting directly with the board.

### 3. Staff Reception Dashboard (`/reception`)
* **Interface**: Desk console dashboard for clinic operations.
* **Actions**: Core staff controls: **Call Next**, **Complete**, and **Skip** (moves the current patient to the end of the queue per Business Rule #5).
* **Metrics**: Displays live statistics (total waiting, current active, estimated consultation pace, and door guard status).
* **Configuration**: Slide toggles to open/close registration and sliders to adjust consultation minutes.

### 4. Settings Dashboard (`/settings`)
* **Interface**: Admin control panel.
* **Rule Enforcements**: Configures estimated minutes per patient and opens/closes queue gates. Gracefully handles validation errors thrown by the Spring Boot backend (e.g. rejecting gate closure when a patient is actively in service).
