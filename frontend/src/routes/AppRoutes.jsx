import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";

// Auth Pages
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

// Core Pages
import Home from "../pages/Home.jsx";
import MyFiles from "../pages/MyFiles.jsx";
import LearnPage from "../pages/LearnPage.jsx";
import Profile from "../pages/Profile.jsx";

// Test Pages
import Tests from "../pages/Tests.jsx";
import TestDetail from "../pages/TestDetail.jsx";
import ResultPage from "../pages/ResultPage.jsx";
import AttemptHistory from "../pages/AttemptHistory.jsx";

// Analytics & More
import Analytics from "../pages/Analytics.jsx";
import StudyPlanner from "../pages/StudyPlanner.jsx";
import Achievements from "../pages/Achievements.jsx";
import ProctoringReport from "../pages/ProctoringReport.jsx";

// Full Screen Pages
import ExamInterface from "../pages/ExamInterface.jsx";
import EnvironmentCheck from "../pages/EnvironmentCheck.jsx";

const PageLoader = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "60vh",
    }}
  >
    <LoadingSpinner size="lg" />
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Main Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/my-files" element={<MyFiles />} />
        <Route path="/learn/:action" element={<LearnPage />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/my-tests" element={<Tests />} />
        <Route path="/test/:id" element={<TestDetail />} />
        <Route path="/result/:attemptId" element={<ResultPage />} />
        <Route path="/history" element={<AttemptHistory />} />

        <Route path="/analytics" element={<Analytics />} />
        <Route path="/planner" element={<StudyPlanner />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/proctoring/:attemptId" element={<ProctoringReport />} />
      </Route>

      {/* Full Screen Routes */}
      <Route
        path="/exam/environment-check/:testId"
        element={
          <ProtectedRoute>
            <EnvironmentCheck />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam/:attemptId"
        element={
          <ProtectedRoute>
            <ExamInterface />
          </ProtectedRoute>
        }
      />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default AppRoutes;