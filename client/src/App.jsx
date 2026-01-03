import React from "react";
import Home from "./Pages/Home/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/Login";
import Register from "./Pages/Register/Register";
import Summary from "./Pages/Summary/Summary";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Latest from "./Pages/Latest/Latest";

const App = () => {
  return (
    <div>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/latest" element={<Latest />} />
        </Routes>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
