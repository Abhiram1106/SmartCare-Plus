import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-gradient-to-br from-teal-200/30 to-cyan-300/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white px-5 py-2 rounded-full shadow-md border border-teal-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">Available 24/7 for Emergency Care</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Your Health,
              </span>
              <br />
              <span className="text-gray-800">Our Priority</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Experience world-class healthcare at <span className="font-semibold text-teal-600">SmartCare Plus</span>. 
              Where advanced medical technology meets compassionate care.
            </p>
            
            {/* CTA Buttons */}
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link
                  to="/register"
                  className="group relative px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="relative z-10">Get Started Free</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
                <Link
                  to="/login"
                  className="px-8 py-4 bg-white text-gray-700 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl border-2 border-gray-200 hover:border-teal-300 transform hover:-translate-y-1 transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <Link
                to={`/${user?.role}/dashboard`}
                className="inline-block px-10 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Go to Dashboard →
              </Link>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12">
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">150+</p>
                <p className="text-sm text-gray-600 mt-1">Expert Doctors</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">10+</p>
                <p className="text-sm text-gray-600 mt-1">Specialties</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">24/7</p>
                <p className="text-sm text-gray-600 mt-1">Emergency Care</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
              title: 'Expert Doctors',
              description: '150+ qualified specialists across 10+ medical departments',
              gradient: 'from-teal-500 to-cyan-500'
            },
            {
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Easy Appointments',
              description: 'Book instantly online and manage your healthcare schedule',
              gradient: 'from-blue-500 to-indigo-500'
            },
            {
              icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: 'AI Assistant',
              description: '24/7 intelligent chatbot support for all your health queries',
              gradient: 'from-purple-500 to-pink-500'
            }
          ].map((feature, idx) => (
            <div key={idx} className="group relative bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-100/50 to-cyan-100/50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-indigo-900 text-center mb-12">
            Our Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: '❤️', name: 'Cardiology' },
              { icon: '🧠', name: 'Neurology' },
              { icon: '🦴', name: 'Orthopedics' },
              { icon: '👶', name: 'Pediatrics' },
              { icon: '👁️', name: 'Ophthalmology' },
              { icon: '🦷', name: 'Dentistry' },
              { icon: '🩺', name: 'General Medicine' },
              { icon: '👶', name: 'Gynecology' },
              { icon: '🩻', name: 'Radiology' },
              { icon: '💊', name: 'Pharmacy' }
            ].map((service, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">{service.icon}</div>
                <p className="text-gray-800 font-semibold">{service.name}</p>
              </div>
            ))}
          </div>
      </div>

      {/* Chatbot CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-3xl font-bold mb-4">Need Help? Ask Our AI Assistant!</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Get instant answers to your health questions, find doctors, book appointments, and more - 
            all through our intelligent chatbot.
          </p>
          <Link
            to="/chatbot"
            className="inline-block bg-white text-teal-600 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all shadow-lg transform hover:-translate-y-1"
          >
            Chat Now →
          </Link>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h3 className="text-3xl font-bold text-gray-800 mb-8">Get In Touch</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">SmartCare Plus Medical Center</p>
              <p className="text-gray-500">Advanced Healthcare Services</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">Emergency Hotline</p>
              <p className="text-gray-500">24/7 Available</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium">Email Us</p>
              <p className="text-gray-500">info@smartcareplus.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
