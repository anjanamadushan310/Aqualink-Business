import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Footer from './home/Footer';

const RegistrationForm = ({ setShowLogin }) => {
  const [formData, setFormData] = useState({
    nicNumber: '',
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    nicFrontDocument: null,
    nicBackDocument: null,
    selfieDocument: null,
    userRoles: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewImages, setPreviewImages] = useState({
    nicFront: null,
    nicBack: null,
    selfie: null
  });
  const [availableRoles, setAvailableRoles] = useState([]);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP related states
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Phone country codes
  const [countryCode, setCountryCode] = useState('+94');

  // Password strength evaluation function
  const evaluatePasswordStrength = (password) => {
    if (!password) return '';

    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Character type checks
    if (/[a-z]/.test(password)) score++; // lowercase
    if (/[A-Z]/.test(password)) score++; // uppercase
    if (/[0-9]/.test(password)) score++; // numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // special characters

    // Return strength based on score
    if (score < 3) return 'Weak';
    if (score < 5) return 'Medium';
    return 'Strong';
  };

  // Get password strength color
  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 'Weak': return '#ef4444'; // red
      case 'Medium': return '#f59e0b'; // orange
      case 'Strong': return '#10b981'; // green
      default: return '#d1d5db'; // gray
    }
  };

  // Get password strength bars
  const getPasswordStrengthBars = (strength) => {
    const bars = 4;
    let filledBars = 0;

    switch (strength) {
      case 'Weak': filledBars = 1; break;
      case 'Medium': filledBars = 2; break;
      case 'Strong': filledBars = 4; break;
      default: filledBars = 0;
    }

    return Array.from({ length: bars }, (_, index) => (
      <div
        key={index}
        className={`h-2 rounded-full transition-all duration-300 ${
          index < filledBars
            ? 'opacity-100'
            : 'opacity-30'
        }`}
        style={{
          backgroundColor: index < filledBars
            ? getPasswordStrengthColor(strength)
            : '#e5e7eb'
        }}
      />
    ));
  };

  // Toggle password visibility functions
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Eye icon SVGs
  const EyeIcon = () => (
    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );

  // Fetch available roles from backend
  useEffect(() => {
  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/roles`);
      // Filter out any admin role by value; update as needed based on your actual admin value
      const roles = response.data
        .filter(role => role.value !== 'ADMIN')
        .map(role => {
          // Update Shop Owner label to include (Buyer)
          if (role.value === 'SHOP_OWNER') {
            return { ...role, label: 'Shop Owner (Buyer)' };
          }
          return role;
        });
      setAvailableRoles(roles);
    } catch (error) {
      // fallback roles, also filtering out admin
      setAvailableRoles([
        { value: 'SHOP_OWNER', label: 'Shop Owner (Buyer)' },
        { value: 'FARM_OWNER', label: 'Farm Owner' },
        { value: 'EXPORTER', label: 'Exporter' },
        { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
        { value: 'INDUSTRIAL_STUFF_SELLER', label: 'Industrial Stuff Seller' },
        { value: 'DELIVERY_PERSON', label: 'Delivery Person' }
      ]);
    console.log(error)}
  };

  fetchRoles();
}, []);

  // Check password match whenever passwords change
  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      setPasswordsMatch(formData.password === formData.confirmPassword);
    } else {
      setPasswordsMatch(false);
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Phone number validation - only allow numbers
    if (name === 'phoneNumber') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Limit to 9 digits
      const limitedValue = numericValue.slice(0, 9);
      
      setFormData(prevState => ({
        ...prevState,
        [name]: limitedValue
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }

    if (name === 'email') {
      setOtpVerified(false);
      setOtpSent(false);
      setOtp('');
      setOtpMessage('');
    }

    // Update password strength when password changes
    if (name === 'password') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
  };

  const handleRoleChange = (roleValue) => {
    setFormData(prevState => {
      const currentRoles = prevState.userRoles;
      const updatedRoles = currentRoles.includes(roleValue)
        ? currentRoles.filter(role => role !== roleValue)
        : [...currentRoles, roleValue];

      return {
        ...prevState,
        userRoles: updatedRoles
      };
    });

    if (errors.userRoles) {
      setErrors(prevErrors => ({
        ...prevErrors,
        userRoles: ''
      }));
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0];

    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [documentType]: 'Only JPEG, JPG, and PNG files are allowed'
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [documentType]: 'File size must be less than 5MB'
        }));
        return;
      }

      setFormData(prevState => ({
        ...prevState,
        [documentType]: file
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        const previewKey = documentType === 'nicFrontDocument' ? 'nicFront' :
                           documentType === 'nicBackDocument' ? 'nicBack' : 'selfie';
        setPreviewImages(prevState => ({
          ...prevState,
          [previewKey]: e.target.result
        }));
      };
      reader.readAsDataURL(file);

      if (errors[documentType]) {
        setErrors(prevErrors => ({
          ...prevErrors,
          [documentType]: ''
        }));
      }
    }
  };

  const removeImage = (documentType) => {
    const previewKey = documentType === 'nicFrontDocument' ? 'nicFront' :
                       documentType === 'nicBackDocument' ? 'nicBack' : 'selfie';
    
    setPreviewImages(prevState => ({
      ...prevState,
      [previewKey]: null
    }));
    
    setFormData(prevState => ({
      ...prevState,
      [documentType]: null
    }));

    const inputId = documentType === 'nicFrontDocument' ? 'nicFrontDocument' :
                    documentType === 'nicBackDocument' ? 'nicBackDocument' : 'selfieDocument';
    document.getElementById(inputId).value = '';
  };

  const sendOtp = async () => {
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Enter email to send OTP' }));
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      return;
    }

    setOtpLoading(true);
    setOtpMessage('');

    try {
      setOtpMessage('Sending OTP...');
      const response = await axios.get(`${API_URL}/users/send-otp?email=${formData.email}`);
      setOtpMessage(response.data.message);
      setOtpSent(true);
      setOtpVerified(false);
      setOtp('');
    } catch (error) {
      if (error.response && error.response.data) {
        setOtpMessage(error.response.data.message || 'Failed to send OTP');
      } else {
        setOtpMessage('Failed to send OTP. Please try again.');
      }
      setOtpSent(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) {
      setOtpMessage('Please enter OTP');
      return;
    }

    if (!formData.email) {
      setOtpMessage('Email is required');
      return;
    }

    setOtpLoading(true);

    try {
      const response = await axios.post(`${API_URL}/users/verify-otp`, null, {
        params: { email: formData.email, otp }
      });
      setOtpMessage(response.data.message);
      setOtpVerified(true);
    } catch (error) {
      if (error.response && error.response.data) {
        setOtpMessage(error.response.data.message || 'Invalid OTP');
      } else {
        setOtpMessage('Invalid OTP. Please try again.');
      }
      setOtpVerified(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const nicPattern = /^[0-9]{9}[vVxX]$|^[0-9]{12}$/;
    if (!formData.nicNumber) {
      newErrors.nicNumber = 'NIC number is required';
    } else if (!nicPattern.test(formData.nicNumber)) {
      newErrors.nicNumber = 'Invalid NIC format';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailPattern.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Validate phone number without country code
    const phonePattern = /^[0-9]{9}$/;
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!phonePattern.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 9 digits (without country code)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if at least one document is uploaded
    if (!formData.nicFrontDocument && !formData.nicBackDocument && !formData.selfieDocument) {
      newErrors.documents = 'At least one document (NIC Front, NIC Back, or Selfie) is required';
    }

    if (formData.userRoles.length === 0) {
      newErrors.userRoles = 'Please select at least one role';
    }

    if (!otpVerified) {
      newErrors.otp = 'Please verify your email with OTP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!otpVerified) {
      setMessage('Please verify your email with OTP before submitting');
      return;
    }

    setLoading(true);
    setMessage('');

    const formDataToSend = new FormData();
    formDataToSend.append('nicNumber', formData.nicNumber);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    // Combine country code with phone number
    formDataToSend.append('phoneNumber', countryCode + formData.phoneNumber);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('confirmPassword', formData.confirmPassword);
    
    if (formData.nicFrontDocument) {
      formDataToSend.append('nicFrontDocument', formData.nicFrontDocument);
    }
    if (formData.nicBackDocument) {
      formDataToSend.append('nicBackDocument', formData.nicBackDocument);
    }
    if (formData.selfieDocument) {
      formDataToSend.append('selfieDocument', formData.selfieDocument);
    }
    
    formDataToSend.append('otpVerified', otpVerified);

    formData.userRoles.forEach(role => {
      formDataToSend.append('userRoles', role);
    });

    try {
      await axios.post(
        `${API_URL}/users/register`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Show success message with admin approval notice
      setMessage('Registration successful! Please wait for admin approval to access your account.');

      // Reset form
      setFormData({
        nicNumber: '',
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        nicFrontDocument: null,
        nicBackDocument: null,
        selfieDocument: null,
        userRoles: []
      });
      setPreviewImages({ nicFront: null, nicBack: null, selfie: null });
      setOtp('');
      setOtpVerified(false);
      setOtpSent(false);
      setOtpMessage('');
      setPasswordStrength('');
      setPasswordsMatch(false);
      setShowPassword(false);
      setShowConfirmPassword(false);

      // Clear file inputs
      ['nicFrontDocument', 'nicBackDocument', 'selfieDocument'].forEach(id => {
        const fileInput = document.getElementById(id);
        if (fileInput) {
          fileInput.value = '';
        }
      });

    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message === 'Network Error' 
          ? 'Unable to connect to server. Please check your internet connection.'
          : error.message;
      }
      
      setMessage(errorMessage);
      
      // Clear error message after 7 seconds
      setTimeout(() => {
        setMessage('');
      }, 7000);
    } finally {
      setLoading(false);
    }
  };

  const successMessageKeywords = ['success', 'successful', 'successfully', 'verified', 'approved'];
  const isSuccessMessage = successMessageKeywords.some((keyword) =>
    message?.toLowerCase().includes(keyword)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-600">Join our platform and start your journey</p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* NIC Number */}
              <div className="space-y-2">
                <label htmlFor="nicNumber" className="block text-sm font-semibold text-gray-700">
                  NIC Number
                </label>
                <div className="relative">
                  <input
                    id="nicNumber"
                    name="nicNumber"
                    type="text"
                    value={formData.nicNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                      errors.nicNumber
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                    }`}
                    placeholder="Enter your NIC number"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0v2m4-2v2" />
                    </svg>
                  </div>
                </div>
                {errors.nicNumber && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.nicNumber}
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                      errors.name
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                    }`}
                    placeholder="Enter your full name"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email with OTP */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                      }`}
                      placeholder="Enter your email address"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpLoading || !formData.email}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      otpLoading || !formData.email
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {otpLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </div>
                    ) : 'Send OTP'}
                  </button>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* OTP Input */}
              {otpSent && (
                <div className="space-y-2">
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700">
                    Enter OTP
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength="6"
                        className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                          errors.otp
                            ? 'border-red-300 focus:border-red-500 bg-red-50'
                            : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                        }`}
                        placeholder="Enter 6-digit OTP"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={otpLoading || !otp || otpVerified}
                      className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                        otpLoading || !otp || otpVerified
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {otpLoading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </div>
                      ) : otpVerified ? (
                        <div className="flex items-center">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      ) : 'Verify'}
                    </button>
                  </div>
                  {errors.otp && (
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.otp}
                    </p>
                  )}
                </div>
              )}

              {/* OTP Message */}
              {otpMessage && (
                <div className={`p-4 rounded-xl border-l-4 ${
                  otpMessage.includes('successfully') || otpMessage.includes('sent') || otpVerified
                    ? 'bg-green-50 border-green-400 text-green-800'
                    : 'bg-red-50 border-red-400 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {otpMessage.includes('successfully') || otpMessage.includes('sent') || otpVerified ? (
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {otpMessage}
                  </div>
                </div>
              )}

              {/* Phone Number - Horizontal Layout */}
              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <div className="flex space-x-2">
                  <div className="w-32">
                    <select
  value={countryCode}
  onChange={(e) => setCountryCode(e.target.value)}
  className="w-full px-3 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 hover:border-gray-300 transition-all duration-200"
>
  <option value="+93">🇦🇫 Afghanistan +93</option>
  <option value="+355">🇦🇱 Albania +355</option>
  <option value="+213">🇩🇿 Algeria +213</option>
  <option value="+1-684">🇦🇸 American Samoa +1-684</option>
  <option value="+376">🇦🇩 Andorra +376</option>
  <option value="+244">🇦🇴 Angola +244</option>
  <option value="+1-264">🇦🇮 Anguilla +1-264</option>
  <option value="+1-268">🇦🇬 Antigua and Barbuda +1-268</option>
  <option value="+54">🇦🇷 Argentina +54</option>
  <option value="+374">🇦🇲 Armenia +374</option>
  <option value="+297">🇦🇼 Aruba +297</option>
  <option value="+61">🇦🇺 Australia +61</option>
  <option value="+43">🇦🇹 Austria +43</option>
  <option value="+994">🇦🇿 Azerbaijan +994</option>
  <option value="+1-242">🇧🇸 Bahamas +1-242</option>
  <option value="+973">🇧🇭 Bahrain +973</option>
  <option value="+880">🇧🇩 Bangladesh +880</option>
  <option value="+1-246">🇧🇧 Barbados +1-246</option>
  <option value="+375">🇧🇾 Belarus +375</option>
  <option value="+32">🇧🇪 Belgium +32</option>
  <option value="+501">🇧🇿 Belize +501</option>
  <option value="+229">🇧🇯 Benin +229</option>
  <option value="+1-441">🇧🇲 Bermuda +1-441</option>
  <option value="+975">🇧🇹 Bhutan +975</option>
  <option value="+591">🇧🇴 Bolivia +591</option>
  <option value="+387">🇧🇦 Bosnia and Herzegovina +387</option>
  <option value="+267">🇧🇼 Botswana +267</option>
  <option value="+55">🇧🇷 Brazil +55</option>
  <option value="+246">🇮🇴 British Indian Ocean Territory +246</option>
  <option value="+1-284">🇻🇬 British Virgin Islands +1-284</option>
  <option value="+673">🇧🇳 Brunei +673</option>
  <option value="+359">🇧🇬 Bulgaria +359</option>
  <option value="+226">🇧🇫 Burkina Faso +226</option>
  <option value="+257">🇧🇮 Burundi +257</option>
  <option value="+238">🇨🇻 Cape Verde +238</option>
  <option value="+855">🇰🇭 Cambodia +855</option>
  <option value="+237">🇨🇲 Cameroon +237</option>
  <option value="+1">🇨🇦 Canada +1</option>
  <option value="+1-345">🇰🇾 Cayman Islands +1-345</option>
  <option value="+236">🇨🇫 Central African Republic +236</option>
  <option value="+235">🇹🇩 Chad +235</option>
  <option value="+56">🇨🇱 Chile +56</option>
  <option value="+86">🇨🇳 China +86</option>
  <option value="+57">🇨🇴 Colombia +57</option>
  <option value="+269">🇰🇲 Comoros +269</option>
  <option value="+682">🇨🇰 Cook Islands +682</option>
  <option value="+506">🇨🇷 Costa Rica +506</option>
  <option value="+225">🇨🇮 Côte d'Ivoire +225</option>
  <option value="+385">🇭🇷 Croatia +385</option>
  <option value="+53">🇨🇺 Cuba +53</option>
  <option value="+599">🇨🇼 Curaçao +599</option>
  <option value="+357">🇨🇾 Cyprus +357</option>
  <option value="+420">🇨🇿 Czech Republic +420</option>
  <option value="+243">🇨🇩 DR Congo +243</option>
  <option value="+45">🇩🇰 Denmark +45</option>
  <option value="+253">🇩🇯 Djibouti +253</option>
  <option value="+1-767">🇩🇲 Dominica +1-767</option>
  <option value="+1-809">🇩🇴 Dominican Republic +1-809</option>
  <option value="+670">🇹🇱 East Timor +670</option>
  <option value="+593">🇪🇨 Ecuador +593</option>
  <option value="+20">🇪🇬 Egypt +20</option>
  <option value="+503">🇸🇻 El Salvador +503</option>
  <option value="+240">🇬🇶 Equatorial Guinea +240</option>
  <option value="+291">🇪🇷 Eritrea +291</option>
  <option value="+372">🇪🇪 Estonia +372</option>
  <option value="+268">🇸🇿 Eswatini +268</option>
  <option value="+251">🇪🇹 Ethiopia +251</option>
  <option value="+298">🇫🇴 Faroe Islands +298</option>
  <option value="+500">🇫🇰 Falkland Islands +500</option>
  <option value="+679">🇫🇯 Fiji +679</option>
  <option value="+358">🇫🇮 Finland +358</option>
  <option value="+33">🇫🇷 France +33</option>
  <option value="+689">🇵🇫 French Polynesia +689</option>
  <option value="+241">🇬🇦 Gabon +241</option>
  <option value="+220">🇬🇲 Gambia +220</option>
  <option value="+995">🇬🇪 Georgia +995</option>
  <option value="+49">🇩🇪 Germany +49</option>
  <option value="+233">🇬🇭 Ghana +233</option>
  <option value="+350">🇬🇮 Gibraltar +350</option>
  <option value="+30">🇬🇷 Greece +30</option>
  <option value="+299">🇬🇱 Greenland +299</option>
  <option value="+1-473">🇬🇩 Grenada +1-473</option>
  <option value="+1-671">🇬🇺 Guam +1-671</option>
  <option value="+502">🇬🇹 Guatemala +502</option>
  <option value="+224">🇬🇳 Guinea +224</option>
  <option value="+245">🇬🇼 Guinea-Bissau +245</option>
  <option value="+592">🇬🇾 Guyana +592</option>
  <option value="+509">🇭🇹 Haiti +509</option>
  <option value="+379">🇻🇦 Holy See +379</option>
  <option value="+504">🇭🇳 Honduras +504</option>
  <option value="+852">🇭🇰 Hong Kong +852</option>
  <option value="+36">🇭🇺 Hungary +36</option>
  <option value="+354">🇮🇸 Iceland +354</option>
  <option value="+91">🇮🇳 India +91</option>
  <option value="+62">🇮🇩 Indonesia +62</option>
  <option value="+98">🇮🇷 Iran +98</option>
  <option value="+964">🇮🇶 Iraq +964</option>
  <option value="+353">🇮🇪 Ireland +353</option>
  <option value="+972">🇮🇱 Israel +972</option>
  <option value="+39">🇮🇹 Italy +39</option>
  <option value="+1-876">🇯🇲 Jamaica +1-876</option>
  <option value="+81">🇯🇵 Japan +81</option>
  <option value="+962">🇯🇴 Jordan +962</option>
  <option value="+7">🇰🇿 Kazakhstan +7</option>
  <option value="+254">🇰🇪 Kenya +254</option>
  <option value="+686">🇰🇮 Kiribati +686</option>
  <option value="+965">🇰🇼 Kuwait +965</option>
  <option value="+996">🇰🇬 Kyrgyzstan +996</option>
  <option value="+856">🇱🇦 Laos +856</option>
  <option value="+371">🇱🇻 Latvia +371</option>
  <option value="+961">🇱🇧 Lebanon +961</option>
  <option value="+266">🇱🇸 Lesotho +266</option>
  <option value="+231">🇱🇷 Liberia +231</option>
  <option value="+218">🇱🇾 Libya +218</option>
  <option value="+423">🇱🇮 Liechtenstein +423</option>
  <option value="+370">🇱🇹 Lithuania +370</option>
  <option value="+352">🇱🇺 Luxembourg +352</option>
  <option value="+853">🇲🇴 Macao +853</option>
  <option value="+261">🇲🇬 Madagascar +261</option>
  <option value="+265">🇲🇼 Malawi +265</option>
  <option value="+60">🇲🇾 Malaysia +60</option>
  <option value="+960">🇲🇻 Maldives +960</option>
  <option value="+223">🇲🇱 Mali +223</option>
  <option value="+356">🇲🇹 Malta +356</option>
  <option value="+692">🇲🇭 Marshall Islands +692</option>
  <option value="+222">🇲🇷 Mauritania +222</option>
  <option value="+230">🇲🇺 Mauritius +230</option>
  <option value="+262">🇾🇹 Mayotte +262</option>
  <option value="+52">🇲🇽 Mexico +52</option>
  <option value="+691">🇫🇲 Micronesia +691</option>
  <option value="+373">🇲🇩 Moldova +373</option>
  <option value="+377">🇲🇨 Monaco +377</option>
  <option value="+976">🇲🇳 Mongolia +976</option>
  <option value="+382">🇲🇪 Montenegro +382</option>
  <option value="+1-664">🇲🇸 Montserrat +1-664</option>
  <option value="+212">🇲🇦 Morocco +212</option>
  <option value="+258">🇲🇿 Mozambique +258</option>
  <option value="+95">🇲🇲 Myanmar +95</option>
  <option value="+264">🇳🇦 Namibia +264</option>
  <option value="+674">🇳🇷 Nauru +674</option>
  <option value="+977">🇳🇵 Nepal +977</option>
  <option value="+31">🇳🇱 Netherlands +31</option>
  <option value="+687">🇳🇨 New Caledonia +687</option>
  <option value="+64">🇳🇿 New Zealand +64</option>
  <option value="+505">🇳🇮 Nicaragua +505</option>
  <option value="+227">🇳🇪 Niger +227</option>
  <option value="+234">🇳🇬 Nigeria +234</option>
  <option value="+683">🇳🇺 Niue +683</option>
  <option value="+1-670">🇲🇵 Northern Mariana Islands +1-670</option>
  <option value="+850">🇰🇵 North Korea +850</option>
  <option value="+47">🇳🇴 Norway +47</option>
  <option value="+968">🇴🇲 Oman +968</option>
  <option value="+92">🇵🇰 Pakistan +92</option>
  <option value="+680">🇵🇼 Palau +680</option>
  <option value="+970">🇵🇸 Palestine +970</option>
  <option value="+507">🇵🇦 Panama +507</option>
  <option value="+675">🇵🇬 Papua New Guinea +675</option>
  <option value="+595">🇵🇾 Paraguay +595</option>
  <option value="+51">🇵🇪 Peru +51</option>
  <option value="+63">🇵🇭 Philippines +63</option>
  <option value="+48">🇵🇱 Poland +48</option>
  <option value="+351">🇵🇹 Portugal +351</option>
  <option value="+1-787">🇵🇷 Puerto Rico +1-787</option>
  <option value="+974">🇶🇦 Qatar +974</option>
  <option value="+242">🇨🇬 Republic of the Congo +242</option>
  <option value="+262">🇷🇪 Reunion +262</option>
  <option value="+40">🇷🇴 Romania +40</option>
  <option value="+7">🇷🇺 Russia +7</option>
  <option value="+250">🇷🇼 Rwanda +250</option>
  <option value="+290">🇸🇭 Saint Helena +290</option>
  <option value="+1-869">🇰🇳 Saint Kitts and Nevis +1-869</option>
  <option value="+1-758">🇱🇨 Saint Lucia +1-758</option>
  <option value="+508">🇵🇲 Saint Pierre and Miquelon +508</option>
  <option value="+1-784">🇻🇨 Saint Vincent and the Grenadines +1-784</option>
  <option value="+685">🇼🇸 Samoa +685</option>
  <option value="+378">🇸🇲 San Marino +378</option>
  <option value="+239">🇸🇹 Sao Tome and Principe +239</option>
  <option value="+966">🇸🇦 Saudi Arabia +966</option>
  <option value="+221">🇸🇳 Senegal +221</option>
  <option value="+381">🇷🇸 Serbia +381</option>
  <option value="+248">🇸🇨 Seychelles +248</option>
  <option value="+232">🇸🇱 Sierra Leone +232</option>
  <option value="+65">🇸🇬 Singapore +65</option>
  <option value="+421">🇸🇰 Slovakia +421</option>
  <option value="+386">🇸🇮 Slovenia +386</option>
  <option value="+677">🇸🇧 Solomon Islands +677</option>
  <option value="+252">🇸🇴 Somalia +252</option>
  <option value="+27">🇿🇦 South Africa +27</option>
  <option value="+82">🇰🇷 South Korea +82</option>
  <option value="+211">🇸🇸 South Sudan +211</option>
  <option value="+34">🇪🇸 Spain +34</option>
  <option value="+94">🇱🇰 Sri Lanka +94</option>
  <option value="+249">🇸🇩 Sudan +249</option>
  <option value="+597">🇸🇷 Suriname +597</option>
  <option value="+46">🇸🇪 Sweden +46</option>
  <option value="+41">🇨🇭 Switzerland +41</option>
  <option value="+963">🇸🇾 Syria +963</option>
  <option value="+886">🇹🇼 Taiwan +886</option>
  <option value="+992">🇹🇯 Tajikistan +992</option>
  <option value="+255">🇹🇿 Tanzania +255</option>
  <option value="+66">🇹🇭 Thailand +66</option>
  <option value="+228">🇹🇬 Togo +228</option>
  <option value="+690">🇹🇰 Tokelau +690</option>
  <option value="+676">🇹🇴 Tonga +676</option>
  <option value="+1-868">🇹🇹 Trinidad and Tobago +1-868</option>
  <option value="+216">🇹🇳 Tunisia +216</option>
  <option value="+90">🇹🇷 Turkey +90</option>
  <option value="+993">🇹🇲 Turkmenistan +993</option>
  <option value="+1-649">🇹🇨 Turks and Caicos Islands +1-649</option>
  <option value="+688">🇹🇻 Tuvalu +688</option>
  <option value="+1-340">🇻🇮 U.S. Virgin Islands +1-340</option>
  <option value="+256">🇺🇬 Uganda +256</option>
  <option value="+380">🇺🇦 Ukraine +380</option>
  <option value="+971">🇦🇪 United Arab Emirates +971</option>
  <option value="+44">🇬🇧 United Kingdom +44</option>
  <option value="+1">🇺🇸 United States +1</option>
  <option value="+598">🇺🇾 Uruguay +598</option>
  <option value="+998">🇺🇿 Uzbekistan +998</option>
  <option value="+678">🇻🇺 Vanuatu +678</option>
  <option value="+58">🇻🇪 Venezuela +58</option>
  <option value="+84">🇻🇳 Vietnam +84</option>
  <option value="+967">🇾🇪 Yemen +967</option>
  <option value="+260">🇿🇲 Zambia +260</option>
  <option value="+263">🇿🇼 Zimbabwe +263</option>
</select>

                  </div>
                  <div className="flex-1 relative">
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        errors.phoneNumber
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                      }`}
                      placeholder="Enter phone number (9 digits)"
                      maxLength="9"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </div>
                {errors.phoneNumber && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.phoneNumber}
                  </p>
                )}
                <p className="text-xs text-gray-500">Complete number will be: {countryCode}{formData.phoneNumber}</p>
              </div>

              {/* User Roles */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Select Your Role(s)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableRoles.map((role) => (
                    <div key={role.value} className="relative">
                      <input
                        id={role.value}
                        type="checkbox"
                        checked={formData.userRoles.includes(role.value)}
                        onChange={() => handleRoleChange(role.value)}
                        className="sr-only"
                      />
                      <label
                        htmlFor={role.value}
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          formData.userRoles.includes(role.value)
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          formData.userRoles.includes(role.value)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {formData.userRoles.includes(role.value) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="font-medium">{role.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {errors.userRoles && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.userRoles}
                  </p>
                )}
                {formData.userRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.userRoles.map((roleValue) => {
                      const role = availableRoles.find(r => r.value === roleValue);
                      return (
                        <span
                          key={roleValue}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
                        >
                          {role?.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Password Fields with Eye Icons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        errors.password
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                      }`}
                      placeholder="Enter password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="focus:outline-none"
                      >
                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Password Strength:</span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: getPasswordStrengthColor(passwordStrength) }}
                        >
                          {passwordStrength}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {getPasswordStrengthBars(passwordStrength)}
                      </div>
                      <div className="text-xs text-gray-500">
                        <p>Password should contain:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                            At least 8 characters
                          </li>
                          <li className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                            One uppercase letter
                          </li>
                          <li className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                            One lowercase letter
                          </li>
                          <li className={/[0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                            One number
                          </li>
                          <li className={/[^A-Za-z0-9]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                            One special character
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 pr-12 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : formData.confirmPassword && passwordsMatch
                          ? 'border-green-300 focus:border-green-500 bg-green-50'
                          : 'border-gray-200 focus:border-blue-500 hover:border-gray-300'
                      }`}
                      placeholder="Confirm password"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                      {formData.confirmPassword && passwordsMatch && (
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {formData.confirmPassword && !passwordsMatch && (
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Password Match Indicator */}
                  {formData.confirmPassword && (
                    <div className={`flex items-center text-sm ${
                      passwordsMatch ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {passwordsMatch ? (
                        <>
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Passwords match
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Passwords don't match
                        </>
                      )}
                    </div>
                  )}

                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Document Uploads - Horizontal Layout */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Document Upload (Upload all the documents)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* NIC Front */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">NIC Front</label>
                    <div className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${
                      errors.nicFrontDocument 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {previewImages.nicFront ? (
                        <div className="text-center">
                          <img 
                            src={previewImages.nicFront} 
                            alt="NIC Front Preview" 
                            className="mx-auto h-24 w-auto object-cover rounded-lg shadow-lg mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('nicFrontDocument')}
                            className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                          </svg>
                          <label
                            htmlFor="nicFrontDocument"
                            className="cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          >
                            Choose File
                          </label>
                          <input
                            id="nicFrontDocument"
                            name="nicFrontDocument"
                            type="file"
                            className="sr-only"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'nicFrontDocument')}
                          />
                          <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NIC Back */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">NIC Back</label>
                    <div className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${
                      errors.nicBackDocument 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {previewImages.nicBack ? (
                        <div className="text-center">
                          <img 
                            src={previewImages.nicBack} 
                            alt="NIC Back Preview" 
                            className="mx-auto h-24 w-auto object-cover rounded-lg shadow-lg mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('nicBackDocument')}
                            className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                          </svg>
                          <label
                            htmlFor="nicBackDocument"
                            className="cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          >
                            Choose File
                          </label>
                          <input
                            id="nicBackDocument"
                            name="nicBackDocument"
                            type="file"
                            className="sr-only"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'nicBackDocument')}
                          />
                          <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selfie */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-600">Selfie with NIC card frontside </label>
                    <div className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 ${
                      errors.selfieDocument 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      {previewImages.selfie ? (
                        <div className="text-center">
                          <img 
                            src={previewImages.selfie} 
                            alt="Selfie Preview" 
                            className="mx-auto h-24 w-auto object-cover rounded-lg shadow-lg mb-2"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('selfieDocument')}
                            className="text-red-600 hover:text-red-800 text-xs font-medium transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
                          </svg>
                          <label
                            htmlFor="selfieDocument"
                            className="cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          >
                            Choose File
                          </label>
                          <input
                            id="selfieDocument"
                            name="selfieDocument"
                            type="file"
                            className="sr-only"
                            accept=".jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e, 'selfieDocument')}
                          />
                          <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {errors.documents && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.documents}
                  </p>
                )}
                {Object.keys(errors).some(key => key.includes('Document')) && (
                  <p className="text-sm text-red-600 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Please check document upload errors
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !otpVerified}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  loading || !otpVerified
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : !otpVerified ? (
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Verify Email First
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Create Account
                  </div>
                )}
              </button>

              {/* Success/Error Message */}
              {message && (
                <div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 animate-fadeIn ${
                  isSuccessMessage 
                    ? 'bg-green-50 border-green-500 text-green-800' 
                    : 'bg-red-50 border-red-500 text-red-800'
                }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {isSuccessMessage ? (
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{message}</p>
                  </div>
                  <button
                    onClick={() => setMessage('')}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="font-semibold text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              Sign in here
            </button>
          </p>
        </div> 
        
        <br></br>

      </div>
      <Footer />
    </div>
  );
};

export default RegistrationForm;
