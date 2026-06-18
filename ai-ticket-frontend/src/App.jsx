import { Routes, Route } from "react-router-dom";
import CheckAuth from "./components/check-auth";
import Navbar from "./components/navbar";
import Tickets from "./pages/tickets";
import TicketDetailsPage from "./pages/ticket";
import Login from "./pages/login";
import Signup from "./pages/signup";
import AdminPanel from "./pages/admin";

export default function App() {
  return (
    <div className="min-h-screen bg-base-300 text-base-content flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Routes>
          <Route
            path="/"
            element={
              <CheckAuth protected={true}>
                <Tickets />
              </CheckAuth>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <CheckAuth protected={true}>
                <TicketDetailsPage />
              </CheckAuth>
            }
          />
          <Route
            path="/login"
            element={
              <CheckAuth protected={false}>
                <Login />
              </CheckAuth>
            }
          />
          <Route
            path="/signup"
            element={
              <CheckAuth protected={false}>
                <Signup />
              </CheckAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <CheckAuth protected={true}>
                <AdminPanel />
              </CheckAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}