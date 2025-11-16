import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components (not lazy loaded as they're used on every page)
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import FloatingChatButton from './components/FloatingChatButton';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Chatbot = lazy(() => import('./pages/Chatbot'));
const EnhancedChatbot = lazy(() => import('./pages/EnhancedChatbot'));

// Patient Pages
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const Doctors = lazy(() => import('./pages/patient/Doctors'));
const DoctorDetails = lazy(() => import('./pages/DoctorDetails'));
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'));
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments'));
const MyPrescriptions = lazy(() => import('./pages/patient/MyPrescriptions'));
const MyPayments = lazy(() => import('./pages/patient/MyPayments'));
const PatientProfile = lazy(() => import('./pages/patient/PatientProfile'));
const PaymentGateway = lazy(() => import('./pages/patient/PaymentGateway'));
const ChatWithDoctor = lazy(() => import('./pages/patient/ChatWithDoctor'));
const MyReviews = lazy(() => import('./pages/MyReviews'));

// Premium Patient Features
const MedicalRecords = lazy(() => import('./pages/patient/MedicalRecords'));
const Telemedicine = lazy(() => import('./pages/patient/Telemedicine'));
const AISymptomChecker = lazy(() => import('./pages/patient/AISymptomChecker'));

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorPrescriptions = lazy(() => import('./pages/doctor/DoctorPrescriptions'));
const PatientHistory = lazy(() => import('./pages/doctor/PatientHistory'));
const DoctorProfile = lazy(() => import('./pages/doctor/DoctorProfile'));
const DoctorChat = lazy(() => import('./pages/doctor/DoctorChat'));
const DoctorReviews = lazy(() => import('./pages/doctor/DoctorReviews'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageAppointments = lazy(() => import('./pages/admin/ManageAppointments'));
const ManageIntents = lazy(() => import('./pages/admin/ManageIntents'));
const ChatLogs = lazy(() => import('./pages/admin/ChatLogs'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const ManageReviews = lazy(() => import('./components/reviews/AdminReviewModeration'));

// Premium Admin Features
const PredictiveAnalytics = lazy(() => import('./pages/admin/PredictiveAnalytics'));
const SecurityAuditLogs = lazy(() => import('./pages/admin/SecurityAuditLogs'));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600 font-medium">Loading...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <FloatingChatButton />
        <Suspense fallback={<LoadingFallback />}>
          <div className="min-h-screen bg-gray-50 pt-20">
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/chatbot" element={<EnhancedChatbot />} />
            <Route path="/chatbot/basic" element={<Chatbot />} />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <PrivateRoute roles={['patient']}>
                  <PatientDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/doctors"
              element={
                <PrivateRoute roles={['patient']}>
                  <Doctors />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/doctors/:id"
              element={
                <PrivateRoute roles={['patient']}>
                  <DoctorDetails />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/my-reviews"
              element={
                <PrivateRoute roles={['patient']}>
                  <MyReviews />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/book-appointment"
              element={
                <PrivateRoute roles={['patient']}>
                  <Doctors />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/book-appointment/:doctorId"
              element={
                <PrivateRoute roles={['patient']}>
                  <BookAppointment />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <PrivateRoute roles={['patient']}>
                  <MyAppointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/prescriptions"
              element={
                <PrivateRoute roles={['patient']}>
                  <MyPrescriptions />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/payments"
              element={
                <PrivateRoute roles={['patient']}>
                  <MyPayments />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/payment-gateway"
              element={
                <PrivateRoute roles={['patient']}>
                  <PaymentGateway />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <PrivateRoute roles={['patient']}>
                  <PatientProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/chat"
              element={
                <PrivateRoute roles={['patient']}>
                  <ChatWithDoctor />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/medical-records"
              element={
                <PrivateRoute roles={['patient']}>
                  <MedicalRecords />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/telemedicine"
              element={
                <PrivateRoute roles={['patient']}>
                  <Telemedicine />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/symptom-checker"
              element={
                <PrivateRoute roles={['patient']}>
                  <AISymptomChecker />
                </PrivateRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <PrivateRoute roles={['doctor']}>
                  <DoctorDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <PrivateRoute roles={['doctor']}>
                  <DoctorAppointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor/prescriptions"
              element={
                <PrivateRoute roles={['doctor']}>
                  <DoctorPrescriptions />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor/reviews"
              element={
                <PrivateRoute roles={['doctor']}>
                  <DoctorReviews />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor/patient-history"
              element={
                <PrivateRoute roles={['doctor']}>
                  <PatientHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor/profile"
              element={
                <PrivateRoute roles={['doctor']}>
                  <DoctorProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/doctor/chat"
              element={
                <PrivateRoute roles={['doctor']}>
                  <DoctorChat />
                </PrivateRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute roles={['admin']}>
                  <ManageUsers />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/appointments"
              element={
                <PrivateRoute roles={['admin']}>
                  <ManageAppointments />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/intents"
              element={
                <PrivateRoute roles={['admin']}>
                  <ManageIntents />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/chatlogs"
              element={
                <PrivateRoute roles={['admin']}>
                  <ChatLogs />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/profile"
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <PrivateRoute roles={['admin']}>
                  <AnalyticsDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <PrivateRoute roles={['admin']}>
                  <ManageReviews />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/predictive-analytics"
              element={
                <PrivateRoute roles={['admin']}>
                  <PredictiveAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/security-audit"
              element={
                <PrivateRoute roles={['admin']}>
                  <SecurityAuditLogs />
                </PrivateRoute>
              }
            />
          </Routes>
          </div>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
