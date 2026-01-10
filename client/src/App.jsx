// App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Pages/Home/Home";
import Login from "./Pages/Login/Login";
import Register from "./Pages/Register/Register";
import Summary from "./Pages/Summary/Summary";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Latest from "./Pages/Latest/Latest";
import News from "./Pages/News/News";
import NewsDetails from "./Pages/NewsDetails/NewsDetails";
import Dashboard from "./Pages/Dashboard/Dashboard";

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* ✅ allow Clerk internal callback routes */}
        <Route path="/login/*" element={<Login />} />
        <Route path="/register/*" element={<Register />} />

        <Route path="/summary" element={<Summary />} />
        <Route path="/latest" element={<Latest />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<NewsDetails />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
