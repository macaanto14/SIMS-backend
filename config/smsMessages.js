const smsMessages = {
  'en': {
    'registration': 'Your SIMS registration verification code is: {code}. Valid for 10 minutes. Do not share this code.',
    'login': 'Your SIMS login verification code is: {code}. Valid for 5 minutes. Do not share this code.',
    'password_reset': 'Your SIMS password reset code is: {code}. Valid for 15 minutes. Do not share this code.',
    'two_factor': 'Your SIMS 2FA verification code is: {code}. Valid for 5 minutes. Do not share this code.'
  },
  'am': { // Amharic for Ethiopia
    'registration': 'የSIMS ምዝገባ ማረጋገጫ ኮድዎ: {code}። ለ10 ደቂቃ ይቆያል። ይህን ኮድ አያጋሩ።',
    'login': 'የSIMS መግቢያ ማረጋገጫ ኮድዎ: {code}። ለ5 ደቂቃ ይቆያል። ይህን ኮድ አያጋሩ።',
    'password_reset': 'የSIMS የይለፍ ቃል ዳግም ማስተካከያ ኮድዎ: {code}። ለ15 ደቂቃ ይቆያል። ይህን ኮድ አያጋሩ።',
    'two_factor': 'የSIMS 2FA ማረጋገጫ ኮድዎ: {code}። ለ5 ደቂቃ ይቆያል። ይህን ኮድ አያጋሩ።'
  }
};

function getMessage(purpose, language = 'en', code = null) {
  const messages = smsMessages[language] || smsMessages['en'];
  let message = messages[purpose] || messages['registration'];
  
  if (code) {
    message = message.replace('{code}', code);
  }
  
  return message;
}

function getSupportedLanguages() {
  return Object.keys(smsMessages);
}

function getSupportedPurposes() {
  return Object.keys(smsMessages['en']);
}

module.exports = {
  smsMessages,
  getMessage,
  getSupportedLanguages,
  getSupportedPurposes
};