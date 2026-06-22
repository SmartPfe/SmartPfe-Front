/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import OnboardingLayout from "./layouts/OnboardingLayout";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ProjectBasics from "./pages/onboarding/ProjectBasics";
import ProjectDescription from "./pages/onboarding/ProjectDescription";
import TechnicalContext from "./pages/onboarding/TechnicalContext";
import SummaryReview from "./pages/onboarding/SummaryReview";
import Overview from "./pages/workspace/Overview";
import ProblemStatement from "./pages/workspace/ProblemStatement";
import Actors from "./pages/workspace/Actors";
import ProductBacklog from "./pages/workspace/ProductBacklog";
import ReportStructure from "./pages/workspace/ReportStructure";
import ReportBuilder from "./pages/workspace/ReportBuilder";
import Presentation from "./pages/workspace/Presentation";
import Pitch from "./pages/workspace/Pitch";
import UserStories from "./pages/workspace/UserStories";
import ExistingSolutions from "./pages/workspace/ExistingSolutions";
import FunctionalRequirements from "./pages/workspace/FunctionalRequirements";
import NonFunctionalRequirements from "./pages/workspace/NonFunctionalRequirements";
import UmlPreparation from "./pages/workspace/UmlPreparation";

import JurySimulation from "./pages/workspace/JurySimulation";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Landing from "./pages/Landing";
  
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password/:token" element={<ResetPassword />} />
        </Route>

      <Route path="/onboarding" element={ <ProtectedRoute> <OnboardingLayout /> </ProtectedRoute> }>
              <Route path="1" element={<ProjectBasics />} />
          <Route path="2" element={<ProjectDescription />} />
          <Route path="3" element={<TechnicalContext />} />
          <Route path="4" element={<SummaryReview />} />
        </Route>

      <Route path="/workspace" element={ <ProtectedRoute> <WorkspaceLayout /> </ProtectedRoute>}>     
         <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="problem-statement" element={<ProblemStatement />} />
          <Route path="actors" element={<Actors />} />
          <Route path="solutions" element={<ExistingSolutions />} />
          <Route path="functional-requirements" element={<FunctionalRequirements />} />
          <Route path="non-functional-requirements" element={<NonFunctionalRequirements />} />
          <Route path="uml-preparation" element={<UmlPreparation />} />
          <Route path="backlog" element={<ProductBacklog />} />
          <Route path="report-structure" element={<ReportStructure />} />
          <Route path="report-builder" element={<ReportBuilder />} />
          <Route path="presentation" element={<Presentation />} />
          <Route path="pitch" element={<Pitch />} />
          <Route path="jury-simulation" element={<JurySimulation />} />
          <Route path="user-stories" element={<UserStories />} />
          <Route path="*" element={<Overview />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
