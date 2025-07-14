import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Notifications from "./pages/Notifications";
import Upload from "./pages/Upload";
import { UserProvider } from "./context/UserContext";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;