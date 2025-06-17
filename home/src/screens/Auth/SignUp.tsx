import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import authService from "../../services/api/authService";
import smsService from "../../services/api/smsService";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { EyeIcon, EyeOffIcon, ArrowRightIcon, ArrowLeftIcon, AlertCircleIcon } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config";

export const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1: Basic info, 2: Verification
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();

  // Validate phone number format for Bangladesh
  const validatePhoneNumber = (phoneNumber: string) => {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it starts with 01 and has exactly 11 digits
    if (!cleaned.startsWith('01') || cleaned.length !== 11) {
      setPhoneError('Phone number must start with 01 and have 11 digits');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  // Handle phone number input with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    
    // Limit to 11 digits and ensure it starts with the right prefix
    if (cleaned.length <= 11) {
      setPhone(cleaned);
      
      // Clear error when empty or validate when something is entered
      if (cleaned.length === 0) {
        setPhoneError('');
      } else {
        validatePhoneNumber(cleaned);
      }
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    
    // Validate phone format
    if (!validatePhoneNumber(phone)) {
      setError("Please enter a valid Bangladesh phone number");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      // Format phone number consistently - use the SMS service for consistency
      const formattedPhone = formatPhoneNumber(phone);
      console.log(`Phone number formatted: ${phone} → ${formattedPhone}`);
      
      // Send verification code to phone number
      await smsService.sendVerificationCode(formattedPhone);
      startResendCountdown();
      
      // Move to verification step
      setStep(2);
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.response?.data?.error || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError("");
  };

  const startResendCountdown = () => {
    setResendDisabled(true);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    
    setError("");
    try {
      await smsService.resendVerificationCode(phone);
      startResendCountdown();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to resend verification code. Please try again.");
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter a valid verification code");
      return;
    }
    
    setVerifying(true);
    setError("");

    try {
      // Format the phone number consistently
      const formattedPhone = formatPhoneNumber(phone);
      console.log(`Verifying phone ${phone} (formatted: ${formattedPhone}) with code ${verificationCode}`);
      
      // First verify the phone number
      console.log("Verifying phone number first...");
      
      // Verify phone number
      await smsService.verifyPhoneNumber(formattedPhone, verificationCode);
      console.log("Phone verification successful");
      
      // Now register the user with verified phone
      console.log("Now registering user with verified phone...");
      
      // Split the fullName into first_name and last_name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Format data exactly as the backend expects it
      const userData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone: formattedPhone
      };
      
      console.log("Registering with data:", userData);
      
      // Register the user with the formatted data
      const registerResponse = await authService.register(userData);
      console.log("Registration successful:", registerResponse);
      
      // Login after registration
      try {
        const loginResponse = await authService.login(email, password);
        console.log("Login successful");
      } catch (loginError) {
        console.error("Auto-login failed:", loginError);
      }
      
      // Navigate to home or redirect URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/';
      navigate(redirectTo);
      
    } catch (err: any) {
      console.error("Error during verification/registration:", err);
      
      // Display appropriate error messages
      if (err.response?.status === 400) {
        // If we have detailed errors from the backend
        if (err.response.data?.errors) {
          const errorMessages = Object.values(err.response.data.errors).flat();
          setError(errorMessages.join(", "));
        } else if (err.response.data?.error) {
          setError(err.response.data.error);
        } else {
          setError("Verification or registration failed. Please check your information and try again.");
        }
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setVerifying(false);
    }
  };

  // Helper function to ensure consistent phone number formatting
  const formatPhoneNumber = (phoneNumber: string): string => {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Case 1: If the number starts with 880, it's already in international format
    if (cleaned.startsWith('880')) {
      return cleaned;
    }
    
    // Case 2: If the number starts with 01, add the country code
    if (cleaned.startsWith('01') && cleaned.length === 11) {
      return `880${cleaned.substring(1)}`;
    }
    
    // Case 3: If the number starts with 1 and is 10 digits, add country code
    if (cleaned.startsWith('1') && cleaned.length === 10) {
      return `880${cleaned}`;
    }
    
    // Return as-is for other cases, though this shouldn't happen with our validation
    console.warn(`Phone number ${cleaned} doesn't match expected Bangladesh format`);
    return cleaned;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Add debugging function to help troubleshoot
  const debugVerificationStatus = async () => {
    try {
      if (!phone || !verificationCode) {
        console.error("Missing phone or verification code for debugging");
        return;
      }
      
      const formattedPhone = formatPhoneNumber(phone);
      console.log("Debugging verification status:");
      console.log(`Phone: ${phone} (formatted: ${formattedPhone})`);
      console.log(`Verification code: ${verificationCode}`);
      
      // Check verification status directly
      try {
        const response = await fetch(`${API_URL}/sms/verify-phone/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone_number: formattedPhone,
            code: verificationCode,
          }),
        });
        
        const data = await response.json();
        console.log("Verification status check response:", response.status, data);
        
        if (response.status === 400) {
          console.error("Verification failed. Server says:", data);
        }
      } catch (err) {
        console.error("Error checking verification status:", err);
      }
    } catch (err) {
      console.error("Debug function error:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white-100">
      <HeaderByAnima showHeroSection={false} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? "Create an account" : "Verify your phone"}
            </h1>
            <p className="text-gray-600">
              {step === 1 ? (
                <>
                  Already have an account?{" "}
                  <Link to="/signin" className="text-primarymain hover:underline">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  We've sent a 6-digit code to {phone}
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full h-12 border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-12 border-gray-300 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                    className={`w-full h-12 border-gray-300 rounded-lg ${phoneError ? 'border-red-300' : ''}`}
                  />
                  {phoneError && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <AlertCircleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {phoneError ? (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                ) : (
                  <p className="text-xs text-gray-500">
                    Must be a Bangladesh phone number starting with 01 (e.g., 01712345678)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full h-12 border-gray-300 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full h-12 border-gray-300 rounded-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={() => setAgreeTerms(!agreeTerms)}
                    className="h-4 w-4 text-primarymain border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600">
                    By creating an account, you agree to our{" "}
                    <Link to="/terms" className="text-primarymain hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primarymain hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !!phoneError}
                className="w-full h-12 bg-primarymain hover:bg-primarymain/90 text-white rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? "Sending code..." : "Continue"}
                {!loading && <ArrowRightIcon size={16} />}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex items-center justify-center"
                  onClick={() => {/* Social sign in logic */}}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                    <path d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.22 13.48 18.6 12 18.6C9.12 18.6 6.69 16.69 5.76 14.1H2.09V16.94C3.9 20.44 7.67 23 12 23Z" fill="#34A853"/>
                    <path d="M5.76 14.1C5.54 13.4 5.42 12.66 5.42 11.9C5.42 11.14 5.54 10.4 5.76 9.7V6.86H2.09C1.39 8.39 1 10.11 1 11.9C1 13.69 1.39 15.41 2.09 16.94L5.76 14.1Z" fill="#FBBC05"/>
                    <path d="M12 5.2C13.62 5.2 15.06 5.75 16.21 6.84L19.36 3.69C17.45 1.9 14.97 0.8 12 0.8C7.67 0.8 3.9 3.36 2.09 6.86L5.76 9.7C6.69 7.11 9.12 5.2 12 5.2Z" fill="#EA4335"/>
                  </svg>
                  <span className="sr-only">Google</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex items-center justify-center"
                  onClick={() => {/* Social sign in logic */}}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073C24 5.40365 18.629 0 12 0C5.37097 0 0 5.40365 0 12.073C0 18.0988 4.38823 23.0935 10.125 24V15.563H7.07661V12.073H10.125V9.41306C10.125 6.38751 11.9153 4.71627 14.6574 4.71627C15.9706 4.71627 17.3439 4.95189 17.3439 4.95189V7.92146H15.8303C14.34 7.92146 13.875 8.85225 13.875 9.8069V12.073H17.2031L16.6708 15.563H13.875V24C19.6118 23.0935 24 18.0988 24 12.073Z"/>
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex items-center justify-center"
                  onClick={() => {/* Social sign in logic */}}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.5172 12.5555C17.5078 10.957 18.232 9.75078 19.6945 8.86719C18.8766 7.69531 17.6117 7.04688 15.9492 6.91016C14.3711 6.77734 12.6609 7.8125 12.0594 7.8125C11.4227 7.8125 9.90234 6.95312 8.65625 6.95312C6.38672 6.98438 4 8.87109 4 12.7031C4 13.7773 4.18359 14.8867 4.55078 16.0273C5.04688 17.5508 6.90625 21.5469 8.83984 21.4844C9.76172 21.4609 10.4258 20.8047 11.6758 20.8047C12.8789 20.8047 13.4922 21.4844 14.5273 21.4844C16.4766 21.4609 18.1562 17.8242 18.625 16.2969C16.0273 15.0938 15.5312 13.1016 15.5312 12.5555H17.5172ZM14.6719 5.34375C15.8281 3.94141 15.7383 2.65625 15.7109 2.25C14.6797 2.30078 13.4883 2.95312 12.8008 3.74219C12.0477 4.57422 11.6328 5.60938 11.7305 6.89844C12.8477 6.97266 13.8086 6.35156 14.6719 5.34375Z" />
                  </svg>
                  <span className="sr-only">Apple</span>
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full h-12 border-gray-300 rounded-lg text-center text-lg tracking-wider"
                />
                <div className="flex justify-between items-center mt-2">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendDisabled}
                    className={`text-sm ${resendDisabled ? 'text-gray-400' : 'text-primarymain hover:underline'}`}
                  >
                    {resendDisabled ? `Resend code in ${countdown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <ArrowLeftIcon size={12} />
                    Change phone
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={verifying}
                className="w-full h-12 bg-primarymain hover:bg-primarymain/90 text-white rounded-lg"
              >
                {verifying ? "Verifying..." : "Verify & Create Account"}
              </Button>
              
              {error && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Having trouble? Make sure you've entered the exact code sent to your phone.</p>
                  <p className="text-gray-400 mt-1">Verification code: {verificationCode}</p>
                  <p className="text-gray-400">Phone format: {formatPhoneNumber(phone)}</p>
                  <button 
                    type="button"
                    onClick={debugVerificationStatus}
                    className="text-primarymain hover:underline text-xs mt-2"
                  >
                    Check verification status
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </main>

      <CtaFooterByAnima />
    </div>
  );
}; 