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
const BookAppointment = lazy(() => import('./pages/patient/BookAppointment'));
const MyAppointments = lazy(() => import('./pages/patient/MyAppointments'));
const MyPayments = lazy(() => import('./pages/patient/MyPayments'));
const PatientProfile = lazy(() => import('./pages/patient/PatientProfile'));
const PaymentGateway = lazy(() => import('./pages/patient/PaymentGateway'));
const ChatWithDoctor = lazy(() => import('./pages/patient/ChatWithDoctor'));

// Doctor Pages
const DoctorDashboard = lazy(() => import('./pages/doctor/DoctorDashboard'));
const DoctorAppointments = lazy(() => import('./pages/doctor/DoctorAppointments'));
const PatientHistory = lazy(() => import('./pages/doctor/PatientHistory'));
const DoctorProfile = lazy(() => import('./pages/doctor/DoctorProfile'));
const DoctorChat = lazy(() => import('./pages/doctor/DoctorChat'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const ManageAppointments = lazy(() => import('./pages/admin/ManageAppointments'));
const ManageIntents = lazy(() => import('./pages/admin/ManageIntents'));
const ChatLogs = lazy(() => import('./pages/admin/ChatLogs'));
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));

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
          <div className="min-h-screen bg-gray-50">
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
          </Routes>
          </div>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
