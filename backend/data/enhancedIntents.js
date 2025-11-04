// Enhanced intents dataset for SmartCare Plus
module.exports = [
  // ===== GREETINGS & GENERAL =====
  {
    tag: 'greeting',
    patterns: [
      'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
      'howdy', 'greetings', 'what\'s up', 'hiya', 'hi there', 'hello there'
    ],
    responses: [
      'Hello! How can I help you today? 😊',
      'Hi there! What can I do for you?',
      'Hey! How may I assist you with your healthcare needs?',
      'Greetings! I\'m here to help. What do you need?'
    ],
    category: 'general',
    context: []
  },
  {
    tag: 'goodbye',
    patterns: [
      'bye', 'goodbye', 'see you', 'talk to you later', 'catch you later',
      'gtg', 'gotta go', 'farewell', 'take care', 'see you soon'
    ],
    responses: [
      'Goodbye! Take care and stay healthy! 🏥',
      'See you later! Don\'t hesitate to return if you need help!',
      'Bye! Have a great day and stay well!',
      'Take care! Come back anytime you need assistance!'
    ],
    category: 'general',
    context: []
  },
  {
    tag: 'thanks',
    patterns: [
      'thank you', 'thanks', 'appreciate it', 'thank you very much',
      'thanks a lot', 'much appreciated', 'thx', 'ty', 'gratitude'
    ],
    responses: [
      'You\'re welcome! Happy to help! 😊',
      'My pleasure! Is there anything else you need?',
      'Anytime! Feel free to ask if you have more questions.',
      'Glad I could help! Stay healthy!'
    ],
    category: 'general',
    context: []
  },
  {
    tag: 'identity',
    patterns: [
      'who are you', 'what are you', 'your name', 'what is your name',
      'tell me about yourself', 'what do you do', 'what can you do'
    ],
    responses: [
      'I\'m SmartCare Plus AI Assistant! I help with appointments, finding doctors, symptom checking, and more. How can I assist you today?',
      'I\'m your healthcare virtual assistant. I can help you book appointments, find doctors, check symptoms, and answer health-related questions!',
      'I\'m an AI-powered healthcare assistant designed to make your medical experience easier. Ask me anything!'
    ],
    category: 'general',
    context: []
  },

  // ===== APPOINTMENTS =====
  {
    tag: 'appointment_booking',
    patterns: [
      'book appointment', 'schedule appointment', 'make appointment',
      'i need to see a doctor', 'book doctor', 'set up appointment',
      'i want to book', 'reserve appointment', 'appointment booking',
      'schedule a visit', 'make a reservation', 'fix an appointment'
    ],
    responses: [
      'I can help you book an appointment! 📅 Please visit the Doctors page and select your preferred doctor, or tell me what specialty you need.',
      'Great! To book an appointment, I need to know what type of doctor you\'re looking for. What\'s your medical concern?',
      'I\'ll help you schedule an appointment. Which department or specialty do you need? (e.g., Cardiology, Dermatology, Pediatrics)'
    ],
    category: 'appointment',
    context: ['appointment']
  },
  {
    tag: 'appointment_cancel',
    patterns: [
      'cancel appointment', 'cancel my appointment', 'i want to cancel',
      'remove appointment', 'delete appointment', 'cancelation',
      'cancel booking', 'appointment cancellation'
    ],
    responses: [
      'I can help you cancel your appointment. Please go to My Appointments page to manage your bookings.',
      'To cancel your appointment, visit My Appointments section. Would you like me to guide you there?',
      'You can cancel appointments from your dashboard under My Appointments. Need help finding it?'
    ],
    category: 'appointment',
    context: ['appointment']
  },
  {
    tag: 'appointment_reschedule',
    patterns: [
      'reschedule appointment', 'change appointment', 'modify appointment',
      'change my booking', 'reschedule my appointment', 'change appointment time',
      'move appointment', 'different time', 'change date'
    ],
    responses: [
      'You can reschedule your appointment from the My Appointments page. Just select the appointment you want to change.',
      'To reschedule, go to My Appointments, select your booking, and choose a new time slot.',
      'I can help you reschedule. Visit My Appointments to select a new date and time.'
    ],
    category: 'appointment',
    context: ['appointment']
  },
  {
    tag: 'appointment_status',
    patterns: [
      'appointment status', 'my appointments', 'upcoming appointments',
      'check my appointment', 'do i have appointments', 'appointment details',
      'when is my appointment', 'appointment time', 'show appointments'
    ],
    responses: [
      'Let me check your appointments... You can view all your appointments in the My Appointments section.',
      'I\'ll fetch your appointment details. You can see upcoming, completed, and cancelled appointments on your dashboard.',
      'Your appointment information is available in My Appointments page. Would you like me to show you how to access it?'
    ],
    category: 'appointment',
    context: ['appointment']
  },

  // ===== DOCTOR SEARCH =====
  {
    tag: 'find_doctor',
    patterns: [
      'find doctor', 'search doctor', 'available doctors', 'list of doctors',
      'show doctors', 'doctor list', 'browse doctors', 'see doctors',
      'who are the doctors', 'find a specialist', 'medical professionals'
    ],
    responses: [
      'You can browse all available doctors in the Doctors section. 👨‍⚕️ I can also help you find a specific specialty!',
      'We have many qualified doctors! Visit the Doctors page or tell me what specialty you need.',
      'I can help you find the right doctor! What type of specialist are you looking for?'
    ],
    category: 'doctor',
    context: ['doctor']
  },
  {
    tag: 'doctor_specialization',
    patterns: [
      'what specializations', 'types of doctors', 'specialist available',
      'cardiology', 'dermatology', 'pediatrics', 'orthopedics',
      'what departments', 'medical specialties', 'doctor categories',
      'list specializations', 'available specialties'
    ],
    responses: [
      'We have doctors from various specializations including:\n• Cardiology (Heart)\n• Dermatology (Skin)\n• Pediatrics (Children)\n• Orthopedics (Bones & Joints)\n• ENT (Ear, Nose, Throat)\n• Gynecology (Women\'s Health)\n• Neurology (Brain & Nerves)\n• Ophthalmology (Eyes)\n• Urology\n• General Medicine',
      'Our medical departments include Cardiology, Dermatology, Pediatrics, Orthopedics, ENT, Gynecology, Neurology, Ophthalmology, Urology, and General Medicine. Which one interests you?'
    ],
    category: 'doctor',
    context: ['doctor', 'specialization']
  },
  {
    tag: 'doctor_experience',
    patterns: [
      'doctor experience', 'how experienced', 'years of experience',
      'doctor qualifications', 'doctor credentials', 'is doctor qualified',
      'doctor education', 'doctor background'
    ],
    responses: [
      'All our doctors are highly qualified with years of experience. You can view each doctor\'s experience, education, and ratings on the Doctors page.',
      'Our doctors have extensive experience ranging from 5 to 30+ years. Check their profiles for detailed credentials!'
    ],
    category: 'doctor',
    context: ['doctor']
  },
  {
    tag: 'consultation_fee',
    patterns: [
      'consultation fee', 'doctor fee', 'how much does it cost', 'charges',
      'price', 'cost of consultation', 'fees', 'doctor charges',
      'consultation cost', 'appointment cost'
    ],
    responses: [
      'Consultation fees vary by doctor and typically range from ₹300 to ₹1500. You can see each doctor\'s fee on their profile.',
      'Our doctors have different consultation fees based on their specialization and experience. Check the Doctors page for specific pricing.'
    ],
    category: 'doctor',
    context: ['doctor', 'payment']
  },

  // ===== SYMPTOMS & MEDICAL INFO =====
  {
    tag: 'symptom_check',
    patterns: [
      'i have symptoms', 'not feeling well', 'feeling sick', 'health issue',
      'medical problem', 'i am sick', 'health concern', 'symptoms',
      'check symptoms', 'what\'s wrong with me', 'diagnose me'
    ],
    responses: [
      'I\'m here to help! 🩺 Please describe your symptoms, and I can recommend the right specialist.',
      'Please tell me what symptoms you\'re experiencing, and I\'ll suggest which type of doctor you should see.',
      'I can help guide you to the right specialist. What symptoms are you having?'
    ],
    category: 'medical',
    context: ['symptom']
  },
  {
    tag: 'symptom_fever',
    patterns: [
      'i have fever', 'high temperature', 'running temperature', 'feeling hot',
      'fever symptoms', 'temperature', 'febrile', 'pyrexia'
    ],
    responses: [
      'Fever can have various causes. I recommend booking an appointment with a General Medicine doctor or ENT specialist if you have throat symptoms. Monitor your temperature and stay hydrated!',
      'For fever, consult our General Medicine department. If it persists or is very high (>103°F), please seek immediate medical attention.'
    ],
    category: 'medical',
    context: ['symptom', 'fever']
  },
  {
    tag: 'symptom_pain',
    patterns: [
      'i have pain', 'it hurts', 'chest pain', 'abdominal pain', 'back pain',
      'headache', 'stomach pain', 'joint pain', 'body pain', 'muscle pain',
      'pain in', 'aching', 'sore'
    ],
    responses: [
      'Pain should be evaluated by a doctor. Can you specify where the pain is located?\n• Chest pain → Cardiology\n• Headache → Neurology\n• Joint/Back pain → Orthopedics\n• Abdominal pain → General Medicine',
      'I recommend seeing a doctor for pain evaluation. Tell me the location: chest, head, abdomen, back, or joints?'
    ],
    category: 'medical',
    context: ['symptom', 'pain']
  },
  {
    tag: 'symptom_breathing',
    patterns: [
      'breathing problem', 'shortness of breath', 'can\'t breathe',
      'difficulty breathing', 'breathless', 'dyspnea', 'respiratory issue',
      'wheezing', 'chest tightness'
    ],
    responses: [
      '⚠️ Breathing difficulties can be serious! If severe, please call 108 immediately. Otherwise, book an appointment with Cardiology or General Medicine.',
      'Shortness of breath requires medical attention. I recommend consulting a Cardiologist or visiting Emergency if it\'s severe.'
    ],
    category: 'medical',
    context: ['symptom', 'emergency']
  },
  {
    tag: 'symptom_skin',
    patterns: [
      'skin problem', 'rash', 'acne', 'skin condition', 'itching',
      'skin rash', 'hives', 'eczema', 'skin allergy', 'dermatitis',
      'skin irritation', 'red skin'
    ],
    responses: [
      'For skin concerns, I recommend booking with our Dermatology department. 🩹 Our skin specialists can help with rashes, acne, and other conditions.',
      'Skin issues are best handled by a Dermatologist. Would you like to see our available dermatology specialists?'
    ],
    category: 'medical',
    context: ['symptom', 'dermatology']
  },

  // ===== EMERGENCY =====
  {
    tag: 'emergency',
    patterns: [
      'emergency', 'urgent', 'critical', 'help immediately',
      'emergency contact', 'ambulance', 'serious', '911', '108',
      'life threatening', 'severe', 'can\'t breathe', 'heart attack',
      'unconscious', 'bleeding heavily'
    ],
    responses: [
      '🚨 EMERGENCY: Please call 108 (Ambulance) or visit the nearest emergency room immediately!\n\nFor life-threatening conditions, do NOT wait for an appointment. This chatbot is NOT for emergency medical services.',
      '⚠️ This is NOT an emergency service! For medical emergencies:\n• Call 108 (Ambulance)\n• Go to nearest ER\n• Call local emergency services\n\nPlease seek immediate help!'
    ],
    category: 'emergency',
    context: ['emergency']
  },

  // ===== PAYMENT =====
  {
    tag: 'payment_info',
    patterns: [
      'payment', 'how to pay', 'payment methods', 'can i pay online',
      'payment options', 'pay', 'payment mode', 'how do i pay',
      'payment gateway', 'payment process'
    ],
    responses: [
      'We accept multiple payment methods: 💳\n• Credit/Debit Cards\n• UPI\n• Net Banking\n• Digital Wallets\n\nAll payments are secured with encryption!',
      'You can pay using Card, UPI, Net Banking, or Wallet. All transactions are secure and verified.'
    ],
    category: 'payment',
    context: ['payment']
  },
  {
    tag: 'payment_status',
    patterns: [
      'payment status', 'check payment', 'payment history',
      'transaction history', 'my payments', 'payment confirmation',
      'did my payment go through', 'payment successful', 'payment pending'
    ],
    responses: [
      'You can view your complete payment history in the My Payments section of your dashboard. 💰',
      'To check payment status, go to My Payments. You\'ll see all completed and pending transactions there.'
    ],
    category: 'payment',
    context: ['payment']
  },
  {
    tag: 'payment_failed',
    patterns: [
      'payment failed', 'payment declined', 'transaction failed',
      'payment not working', 'can\'t make payment', 'payment error',
      'payment issue', 'payment problem'
    ],
    responses: [
      'I\'m sorry you\'re experiencing payment issues. Please try:\n1. Check your internet connection\n2. Verify card details\n3. Try a different payment method\n4. Contact your bank if the issue persists\n\nIf problems continue, contact our support.',
      'Payment failures can happen due to various reasons. Please ensure your payment details are correct and try again. Contact support if the issue persists.'
    ],
    category: 'payment',
    context: ['payment', 'support']
  },
  {
    tag: 'refund',
    patterns: [
      'refund', 'get my money back', 'cancel payment', 'return money',
      'refund policy', 'refund process', 'how to get refund',
      'refund status', 'when will i get refund'
    ],
    responses: [
      'Refund requests are processed within 5-7 business days. If you cancelled an appointment, the refund will be credited to your original payment method.',
      'Refunds are issued for cancelled appointments. Contact our support team with your transaction ID for refund status.'
    ],
    category: 'payment',
    context: ['payment', 'refund']
  },

  // ===== SYSTEM & FEATURES =====
  {
    tag: 'how_to_use',
    patterns: [
      'how to use', 'how does this work', 'guide', 'tutorial',
      'help me navigate', 'how do i', 'instructions', 'user guide',
      'how to book', 'system guide'
    ],
    responses: [
      'Here\'s a quick guide:\n1️⃣ Browse Doctors by specialty\n2️⃣ Select a doctor and time slot\n3️⃣ Confirm appointment\n4️⃣ Make payment\n5️⃣ Receive confirmation\n\nYou can also check symptoms, view appointments, and manage payments!',
      'I can help you navigate! What would you like to do?\n• Book an appointment\n• Find a doctor\n• Check symptoms\n• View payments\n• Manage profile'
    ],
    category: 'system',
    context: []
  },
  {
    tag: 'profile',
    patterns: [
      'my profile', 'account', 'personal information', 'update profile',
      'change details', 'edit profile', 'account settings', 'my details',
      'profile settings'
    ],
    responses: [
      'You can view and edit your profile by clicking on your avatar in the top-right corner, then selecting Profile.',
      'To manage your profile, go to Profile section where you can update personal information, contact details, and preferences.'
    ],
    category: 'system',
    context: ['profile']
  },
  {
    tag: 'hours_of_operation',
    patterns: [
      'working hours', 'opening hours', 'when are you open', 'timings',
      'operation hours', 'what time', 'clinic hours', 'hospital timing',
      'open now', 'are you open'
    ],
    responses: [
      'Our online booking system is available 24/7! 🕐 However, doctor availability varies. Most doctors have slots from 9 AM to 8 PM.',
      'You can book appointments anytime! Our system is 24/7. Doctor consultation hours are typically 9 AM - 8 PM.'
    ],
    category: 'system',
    context: []
  },
  {
    tag: 'location',
    patterns: [
      'location', 'address', 'where are you', 'where is the hospital',
      'clinic address', 'how to reach', 'directions', 'find location',
      'hospital location'
    ],
    responses: [
      'We\'re a digital healthcare platform! Our doctors practice at various locations. Each doctor\'s clinic address is shown on their profile.',
      'Our platform connects you with doctors across multiple locations. Check individual doctor profiles for their clinic addresses.'
    ],
    category: 'system',
    context: []
  },

  // ===== ADMIN & REPORTS =====
  {
    tag: 'admin_help',
    patterns: [
      'admin features', 'manage users', 'admin panel', 'system administration',
      'user management', 'admin help', 'admin dashboard', 'control panel'
    ],
    responses: [
      'As an admin, you can:\n• Manage users (approve/reject doctors)\n• View appointments\n• Monitor chat logs\n• Manage intents\n• View system analytics\n\nAccess these from your Admin Dashboard.',
      'Admin features are available in your dashboard including user management, appointment oversight, and system configuration.'
    ],
    category: 'admin',
    context: ['admin']
  },

  // ===== FALLBACK =====
  {
    tag: 'fallback',
    patterns: [
      'what', 'huh', 'i don\'t understand', 'unclear', 'confusing'
    ],
    responses: [
      'I\'m not sure I understood that. Could you please rephrase? You can ask me about:\n• Booking appointments\n• Finding doctors\n• Checking symptoms\n• Payment info\n• Emergency help',
      'I didn\'t quite catch that. How can I help you today? Try asking about appointments, doctors, symptoms, or payments.'
    ],
    category: 'general',
    context: []
  }
];
