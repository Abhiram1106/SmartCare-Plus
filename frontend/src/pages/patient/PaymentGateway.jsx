import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ToastContainer';

const PaymentGateway = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showWarning } = useToast();
  const [step, setStep] = useState(1); // 1: Payment Method, 2: Details, 3: Verification
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [paymentData, setPaymentData] = useState({
    method: '', // card, upi, netbanking, wallet
    // Card details
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    // UPI details
    upiId: '',
    // Net Banking
    bankName: '',
    // Wallet
    walletProvider: '',
    walletNumber: '',
    // Final verification
    passkey: ''
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const appointmentId = params.get('appointmentId');
    if (appointmentId) {
      fetchAppointment(appointmentId);
    } else {
      navigate('/patient/appointments');
    }
  }, [location]);

  const fetchAppointment = async (id) => {
    try {
      const response = await api.get(`/appointments/${id}`);
      setAppointment(response.data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      showError('Appointment not found');
      navigate('/patient/appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData({ ...paymentData, [name]: value });
  };

  const selectPaymentMethod = (method) => {
    setPaymentData({ ...paymentData, method });
    setStep(2);
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 3) {
        setPaymentData({ ...paymentData, passkey: '' });
      }
    }
  };

  const validatePaymentDetails = () => {
    const { method, cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, upiId, bankName, walletProvider } = paymentData;

    if (method === 'card') {
      if (!cardNumber || cardNumber.length !== 16) {
        showWarning('Please enter a valid 16-digit card number');
        return false;
      }
      if (!cardHolderName) {
        showWarning('Please enter card holder name');
        return false;
      }
      if (!expiryMonth || !expiryYear) {
        showWarning('Please select expiry date');
        return false;
      }
      if (!cvv || cvv.length !== 3) {
        showWarning('Please enter a valid 3-digit CVV');
        return false;
      }
    } else if (method === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        showWarning('Please enter a valid UPI ID');
        return false;
      }
    } else if (method === 'netbanking') {
      if (!bankName) {
        showWarning('Please select a bank');
        return false;
      }
    } else if (method === 'wallet') {
      if (!walletProvider) {
        showWarning('Please select a wallet provider');
        return false;
      }
    }

    return true;
  };

  const proceedToVerification = () => {
    if (validatePaymentDetails()) {
      setStep(3);
    }
  };

  const processPayment = async () => {
    if (!paymentData.passkey) {
      showWarning('Please enter your payment passkey');
      return;
    }

    try {
      setProcessing(true);
      
      // Create payment
      await api.post('/payments', {
        appointment: appointment._id,
        amount: appointment.doctor.consultationFee,
        paymentMethod: paymentData.method,
        passkey: paymentData.passkey,
        transactionDetails: {
          method: paymentData.method,
          ...(paymentData.method === 'card' && {
            cardLast4: paymentData.cardNumber.slice(-4),
            cardHolderName: paymentData.cardHolderName
          }),
          ...(paymentData.method === 'upi' && {
            upiId: paymentData.upiId
          }),
          ...(paymentData.method === 'netbanking' && {
            bankName: paymentData.bankName
          }),
          ...(paymentData.method === 'wallet' && {
            walletProvider: paymentData.walletProvider
          })
        }
      });

      // Show success animation
      showSuccess('✅ Payment Successful! Your appointment is confirmed.');
      navigate('/patient/appointments');
    } catch (error) {
      console.error('Payment error:', error);
      showError(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 border-b-2 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Secure Payment Gateway</h1>
              <p className="text-gray-600 text-sm mt-1">Complete your payment securely</p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-green-600 font-semibold">SSL Secured</span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center w-full max-w-md">
              <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium">Payment Method</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium">Details</span>
              </div>
              <div className={`flex-1 h-1 mx-4 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Verify</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Payment Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            {/* Step 1: Payment Method Selection */}
            {step === 1 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Select Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => selectPaymentMethod('card')}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <svg className="w-12 h-12 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <svg className="w-6 h-6 text-green-600 opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">Credit/Debit Card</h3>
                    <p className="text-sm text-gray-500 mt-1">Visa, Mastercard, RuPay</p>
                  </button>

                  <button
                    onClick={() => selectPaymentMethod('upi')}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <svg className="w-12 h-12 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <svg className="w-6 h-6 text-green-600 opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">UPI</h3>
                    <p className="text-sm text-gray-500 mt-1">GPay, PhonePe, Paytm</p>
                  </button>

                  <button
                    onClick={() => selectPaymentMethod('netbanking')}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <svg className="w-12 h-12 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                      <svg className="w-6 h-6 text-green-600 opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">Net Banking</h3>
                    <p className="text-sm text-gray-500 mt-1">All major banks supported</p>
                  </button>

                  <button
                    onClick={() => selectPaymentMethod('wallet')}
                    className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <svg className="w-12 h-12 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                      </svg>
                      <svg className="w-6 h-6 text-green-600 opacity-0 group-hover:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">Digital Wallet</h3>
                    <p className="text-sm text-gray-500 mt-1">Paytm, MobiKwik, Freecharge</p>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Enter Payment Details</h2>
                  <button onClick={handleBackStep} className="text-blue-600 hover:text-blue-700 font-medium">
                    ← Change Method
                  </button>
                </div>

                {/* Card Payment Form */}
                {paymentData.method === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={paymentData.cardNumber}
                        onChange={handleInputChange}
                        maxLength="16"
                        placeholder="1234 5678 9012 3456"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Holder Name</label>
                      <input
                        type="text"
                        name="cardHolderName"
                        value={paymentData.cardHolderName}
                        onChange={handleInputChange}
                        placeholder="JOHN DOE"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Month</label>
                        <select
                          name="expiryMonth"
                          value={paymentData.expiryMonth}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">MM</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Year</label>
                        <select
                          name="expiryYear"
                          value={paymentData.expiryYear}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">YYYY</option>
                          {[...Array(10)].map((_, i) => (
                            <option key={i} value={2025 + i}>
                              {2025 + i}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="password"
                          name="cvv"
                          value={paymentData.cvv}
                          onChange={handleInputChange}
                          maxLength="3"
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentData.method === 'upi' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                      <input
                        type="text"
                        name="upiId"
                        value={paymentData.upiId}
                        onChange={handleInputChange}
                        placeholder="yourname@upi"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-sm text-gray-500 mt-2">Enter your UPI ID (e.g., 9876543210@paytm)</p>
                    </div>
                  </div>
                )}

                {/* Net Banking Form */}
                {paymentData.method === 'netbanking' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Bank</label>
                      <select
                        name="bankName"
                        value={paymentData.bankName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Choose a bank</option>
                        <option value="SBI">State Bank of India</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="Axis">Axis Bank</option>
                        <option value="PNB">Punjab National Bank</option>
                        <option value="BOB">Bank of Baroda</option>
                        <option value="Kotak">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Wallet Payment Form */}
                {paymentData.method === 'wallet' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Wallet Provider</label>
                      <select
                        name="walletProvider"
                        value={paymentData.walletProvider}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Choose a wallet</option>
                        <option value="Paytm">Paytm</option>
                        <option value="PhonePe">PhonePe</option>
                        <option value="GooglePay">Google Pay</option>
                        <option value="MobiKwik">MobiKwik</option>
                        <option value="Freecharge">Freecharge</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  onClick={proceedToVerification}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Proceed to Verification →
                </button>
              </div>
            )}

            {/* Step 3: Final Verification */}
            {step === 3 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Verify & Pay</h2>
                  <button onClick={handleBackStep} className="text-blue-600 hover:text-blue-700 font-medium">
                    ← Edit Details
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                  <h3 className="font-semibold text-gray-800">Payment Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{paymentData.method}</span>
                  </div>
                  {paymentData.method === 'card' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Card:</span>
                      <span className="font-medium">**** **** **** {paymentData.cardNumber.slice(-4)}</span>
                    </div>
                  )}
                  {paymentData.method === 'upi' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">UPI ID:</span>
                      <span className="font-medium">{paymentData.upiId}</span>
                    </div>
                  )}
                  {paymentData.method === 'netbanking' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-medium">{paymentData.bankName}</span>
                    </div>
                  )}
                  {paymentData.method === 'wallet' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Wallet:</span>
                      <span className="font-medium">{paymentData.walletProvider}</span>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Passkey
                  </label>
                  <input
                    type="password"
                    name="passkey"
                    value={paymentData.passkey}
                    onChange={handleInputChange}
                    maxLength="4"
                    placeholder="Enter your 4-digit passkey"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the passkey you set in your profile. Check your profile's Payment Security section if you forgot it.
                  </p>
                </div>

                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pay ₹{appointment?.doctor?.consultationFee || 0}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Order Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    👨‍⚕️
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">Dr. {appointment?.doctor?.name}</p>
                    <p className="text-sm text-gray-600">{appointment?.doctor?.specialization}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Appointment Date:</span>
                    <span className="font-medium">
                      {appointment?.appointmentDate && new Date(appointment.appointmentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time Slot:</span>
                    <span className="font-medium">{appointment?.timeSlot}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Consultation Fee:</span>
                    <span className="font-medium">₹{appointment?.doctor?.consultationFee}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">₹{appointment?.doctor?.consultationFee}</span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-800 font-medium">Secure Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default PaymentGateway;
