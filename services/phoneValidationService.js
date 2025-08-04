const { parsePhoneNumber, isValidPhoneNumber, getCountryCallingCode } = require('libphonenumber-js');
const crypto = require('crypto');

class PhoneValidationService {
  constructor() {
    this.supportedCountries = {
      'ET': { 
        code: '+251', 
        regex: /^\+251[79]\d{8}$/, 
        format: '+251 XX XXX XXXX',
        name: 'Ethiopia'
      },
      'US': { 
        code: '+1', 
        regex: /^\+1[2-9]\d{9}$/, 
        format: '+1 XXX XXX XXXX',
        name: 'United States'
      },
      'GB': { 
        code: '+44', 
        regex: /^\+44[1-9]\d{8,9}$/, 
        format: '+44 XXXX XXXXXX',
        name: 'United Kingdom'
      },
      'CA': { 
        code: '+1', 
        regex: /^\+1[2-9]\d{9}$/, 
        format: '+1 XXX XXX XXXX',
        name: 'Canada'
      },
      'AU': { 
        code: '+61', 
        regex: /^\+61[2-9]\d{8}$/, 
        format: '+61 X XXXX XXXX',
        name: 'Australia'
      }
    };
    
    this.defaultCountry = process.env.DEFAULT_COUNTRY_CODE || 'ET';
    this.supportedCountryCodes = (process.env.SUPPORTED_COUNTRIES || 'ET,US,GB,CA,AU').split(',');
  }
  
  /**
   * Validate phone number with special handling for Ethiopian numbers
   * @param {string} phoneNumber - Phone number to validate
   * @param {string} countryCode - Optional country code
   * @returns {object} Validation result
   */
  validatePhoneNumber(phoneNumber, countryCode = null) {
    try {
      // Special handling for Ethiopian numbers
      if (this.defaultCountry === 'ET' || countryCode === 'ET') {
        return this.validateAndFormatEthiopianNumber(phoneNumber);
      }
      
      // Clean the phone number
      const cleanedNumber = this.cleanPhoneNumber(phoneNumber);
      
      // Parse the phone number
      const parsedNumber = parsePhoneNumber(cleanedNumber);
      
      if (!parsedNumber) {
        return {
          isValid: false,
          error: 'Invalid phone number format',
          phoneNumber: cleanedNumber
        };
      }
      
      // Check if the number is valid
      if (!parsedNumber.isValid()) {
        return {
          isValid: false,
          error: 'Phone number is not valid',
          phoneNumber: cleanedNumber
        };
      }
      
      // Get country code
      const detectedCountry = parsedNumber.country;
      
      // Check if country is supported
      if (!this.supportedCountryCodes.includes(detectedCountry)) {
        return {
          isValid: false,
          error: `Country ${detectedCountry} is not supported`,
          phoneNumber: cleanedNumber,
          countryCode: detectedCountry
        };
      }
      
      // Format the number in international format
      const formattedNumber = parsedNumber.formatInternational();
      
      return {
        isValid: true,
        phoneNumber: formattedNumber,
        countryCode: detectedCountry,
        nationalNumber: parsedNumber.nationalNumber,
        countryCallingCode: parsedNumber.countryCallingCode,
        type: parsedNumber.getType(),
        carrier: this.getCarrierInfo(detectedCountry, parsedNumber.nationalNumber)
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Phone validation error: ${error.message}`,
        phoneNumber: phoneNumber
      };
    }
  }
  
  /**
   * Validate and format Ethiopian phone numbers specifically
   * Accepts: 927802065, 0927802065, 251927802065, +251927802065
   * Returns: 251927802065 (backend format)
   * @param {string} phoneNumber - Ethiopian phone number
   * @returns {object} Validation result
   */
  validateAndFormatEthiopianNumber(phoneNumber) {
    try {
      // Remove all non-digit characters
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      
      let nationalNumber = '';
      let isValid = false;
      let error = '';
      
      // Validate different Ethiopian number formats
      if (digitsOnly.length === 9 && digitsOnly.startsWith('9')) {
        // Format: 927802065
        nationalNumber = digitsOnly;
        isValid = true;
      } else if (digitsOnly.length === 10 && digitsOnly.startsWith('09')) {
        // Format: 0927802065
        nationalNumber = digitsOnly.substring(1); // Remove leading 0
        isValid = true;
      } else if (digitsOnly.length === 12 && digitsOnly.startsWith('251')) {
        // Format: 251927802065
        nationalNumber = digitsOnly.substring(3); // Remove 251 prefix
        isValid = true;
      } else {
        isValid = false;
        error = 'Invalid Ethiopian phone number format. Expected formats: 927802065, 0927802065, or 251927802065';
      }
      
      // Additional validation for Ethiopian mobile numbers
      if (isValid) {
        // Ethiopian mobile numbers start with 9 and are 9 digits long
        if (!nationalNumber.startsWith('9') || nationalNumber.length !== 9) {
          isValid = false;
          error = 'Ethiopian mobile numbers must start with 9 and be 9 digits long (e.g., 927802065)';
        }
      }
      
      if (!isValid) {
        return {
          isValid: false,
          error: error,
          phoneNumber: phoneNumber
        };
      }
      
      // Format for backend (251927802065)
      const backendFormat = '251' + nationalNumber;
      
      // Format for display (251 92 780 2065)
      const displayFormat = this.getDisplayNumber(backendFormat);
      
      return {
        isValid: true,
        phoneNumber: backendFormat, // Backend format: 251927802065
        displayNumber: displayFormat, // Display format: 251 92 780 2065
        countryCode: 'ET',
        nationalNumber: nationalNumber,
        countryCallingCode: '251',
        type: 'mobile',
        carrier: this.getCarrierInfo('ET', nationalNumber)
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Ethiopian phone validation error: ${error.message}`,
        phoneNumber: phoneNumber
      };
    }
  }
  
  /**
   * Get clean phone number in backend format (251927802065)
   * @param {string} phoneNumber - Phone number to clean
   * @returns {string} Clean phone number
   */
  getCleanPhoneNumber(phoneNumber) {
    const validationResult = this.validatePhoneNumber(phoneNumber);
    return validationResult.isValid ? validationResult.phoneNumber : phoneNumber;
  }
  
  /**
   * Get display-friendly phone number format (251 92 780 2065)
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Display formatted number
   */
  getDisplayNumber(phoneNumber) {
    try {
      // Get clean number first
      const cleanNumber = this.getCleanPhoneNumber(phoneNumber);
      
      // For Ethiopian numbers, format as: 251 92 780 2065
      if (cleanNumber.startsWith('251') && cleanNumber.length === 12) {
        return `${cleanNumber.substring(0, 3)} ${cleanNumber.substring(3, 5)} ${cleanNumber.substring(5, 8)} ${cleanNumber.substring(8)}`;
      }
      
      // For other countries, use libphonenumber formatting
      const parsedNumber = parsePhoneNumber('+' + cleanNumber);
      if (parsedNumber && parsedNumber.isValid()) {
        return parsedNumber.formatInternational();
      }
      
      return cleanNumber;
    } catch (error) {
      console.error('Display number formatting error:', error);
      return phoneNumber;
    }
  }
  
  cleanPhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!cleaned.startsWith('+')) {
      // Try to add default country code
      const defaultCountryInfo = this.supportedCountries[this.defaultCountry];
      if (defaultCountryInfo) {
        cleaned = defaultCountryInfo.code + cleaned;
      } else {
        cleaned = '+' + cleaned;
      }
    }
    
    return cleaned;
  }
  
  /**
   * Format phone number for backend storage (Ethiopian: 251927802065, Others: international)
   * @param {string} phoneNumber - Phone number to format
   * @param {string} format - Format type
   * @returns {string} Formatted number
   */
  formatPhoneNumber(phoneNumber, format = 'backend') {
    try {
      // For Ethiopian numbers, always return backend format
      if (this.defaultCountry === 'ET') {
        const validationResult = this.validateAndFormatEthiopianNumber(phoneNumber);
        if (validationResult.isValid) {
          switch (format) {
            case 'backend':
              return validationResult.phoneNumber; // 251927802065
            case 'display':
              return validationResult.displayNumber; // 251 92 780 2065
            case 'national':
              return '0' + validationResult.nationalNumber; // 0927802065
            default:
              return validationResult.phoneNumber;
          }
        }
        return phoneNumber;
      }
      
      // For other countries, use libphonenumber
      const parsedNumber = parsePhoneNumber(phoneNumber);
      
      if (!parsedNumber || !parsedNumber.isValid()) {
        return phoneNumber;
      }
      
      switch (format) {
        case 'national':
          return parsedNumber.formatNational();
        case 'international':
          return parsedNumber.formatInternational();
        case 'e164':
          return parsedNumber.format('E.164');
        case 'uri':
          return parsedNumber.getURI();
        case 'backend':
          return parsedNumber.format('E.164').substring(1); // Remove + sign
        default:
          return parsedNumber.formatInternational();
      }
      
    } catch (error) {
      console.error('Phone formatting error:', error);
      return phoneNumber;
    }
  }
  
  detectCountryFromPhone(phoneNumber) {
    try {
      // Check if it's Ethiopian format first
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if ((digitsOnly.length === 9 && digitsOnly.startsWith('9')) ||
          (digitsOnly.length === 10 && digitsOnly.startsWith('09')) ||
          (digitsOnly.length === 12 && digitsOnly.startsWith('251'))) {
        return {
          countryCode: 'ET',
          countryName: 'Ethiopia',
          callingCode: '251'
        };
      }
      
      const parsedNumber = parsePhoneNumber(phoneNumber);
      
      if (parsedNumber && parsedNumber.country) {
        return {
          countryCode: parsedNumber.country,
          countryName: this.supportedCountries[parsedNumber.country]?.name || parsedNumber.country,
          callingCode: parsedNumber.countryCallingCode
        };
      }
      
      return null;
    } catch (error) {
      console.error('Country detection error:', error);
      return null;
    }
  }
  
  getSupportedCountries() {
    return this.supportedCountryCodes.map(code => ({
      code,
      name: this.supportedCountries[code]?.name || code,
      callingCode: this.supportedCountries[code]?.code || '',
      format: this.supportedCountries[code]?.format || ''
    }));
  }
  
  getCarrierInfo(countryCode, nationalNumber) {
    // This is a simplified carrier detection
    // In production, you might want to use a more comprehensive carrier database
    const carriers = {
      'ET': {
        '91': 'Ethio Telecom',
        '92': 'Ethio Telecom',
        '93': 'Ethio Telecom',
        '94': 'Ethio Telecom',
        '70': 'Safaricom Ethiopia',
        '71': 'Safaricom Ethiopia'
      },
      'US': {
        // Add US carrier prefixes as needed
      }
    };
    
    if (carriers[countryCode]) {
      const prefix = nationalNumber.substring(0, 2);
      return carriers[countryCode][prefix] || 'Unknown';
    }
    
    return 'Unknown';
  }
  
  hashPhoneNumber(phoneNumber) {
    // Hash phone number for privacy in database storage
    // Use the backend format for consistent hashing
    const validationResult = this.validatePhoneNumber(phoneNumber);
    const normalizedNumber = validationResult.isValid ? validationResult.phoneNumber : phoneNumber;
    
    return crypto
      .createHash('sha256')
      .update(normalizedNumber + (process.env.ENCRYPTION_KEY || 'default-key'))
      .digest('hex');
  }
  
  isPhoneNumberEqual(phone1, phone2) {
    const hash1 = this.hashPhoneNumber(phone1);
    const hash2 = this.hashPhoneNumber(phone2);
    return hash1 === hash2;
  }
}

module.exports = new PhoneValidationService();