// App.jsx
import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import Spinner from "./components/Spinner/Spinner";

const Home = React.lazy(() => import("./Pages/Home/Home"));
const Login = React.lazy(() => import("./Pages/Login/Login"));
const Register = React.lazy(() => import("./Pages/Register/Register"));
const Summary = React.lazy(() => import("./Pages/Summary/Summary"));
const Latest = React.lazy(() => import("./Pages/Latest/Latest"));
const News = React.lazy(() => import("./Pages/News/News"));
const NewsDetails = React.lazy(() => import("./Pages/NewsDetails/NewsDetails"));
const Dashboard = React.lazy(() => import("./Pages/Dashboard/Dashboard"));
const PostSignup = React.lazy(() => import("./Pages/PostSignup/PostSignup"));
const PostSignin = React.lazy(() => import("./Pages/PostSignin/PostSignin"));

const App = () => {
  return (
    <Router>
      <Header />
      <Suspense fallback={<Spinner />}>
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

          <Route path="/post-signup" element={<PostSignup />} />
          <Route path="/post-signin" element={<PostSignin />} />
        </Routes>
      </Suspense>
      <Footer />
    </Router>
  );
};

export default App;
