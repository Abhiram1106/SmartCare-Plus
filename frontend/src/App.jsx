import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import FloatingChatButton from './components/FloatingChatButton';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Chatbot from './pages/Chatbot';
import EnhancedChatbot from './pages/EnhancedChatbot';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import Doctors from './pages/patient/Doctors';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import MyPayments from './pages/patient/MyPayments';
import PatientProfile from './pages/patient/PatientProfile';
import PaymentGateway from './pages/patient/PaymentGateway';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import PatientHistory from './pages/doctor/PatientHistory';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageAppointments from './pages/admin/ManageAppointments';
import ManageIntents from './pages/admin/ManageIntents';
import ChatLogs from './pages/admin/ChatLogs';
import AdminProfile from './pages/admin/AdminProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <FloatingChatButton />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
