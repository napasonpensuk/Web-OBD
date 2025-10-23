import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/์Navbar";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import About  from "./pages/About";

const App = () => (
  <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </BrowserRouter>
);

export default App;
