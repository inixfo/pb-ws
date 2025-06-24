import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { PhoneVerification } from "../../components/auth/PhoneVerification";
import config from "../../config";

// Import Google OAuth library
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  // Initialize Google Sign-In
  useEffect(() => {
    // Load the Google Sign-In API script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "1075587028998-u8no2hgm541gbodc6sqhe57cni77qkj0.apps.googleusercontent.com",
          callback: handleGoogleResponse,
        });

        // Render the Google Sign-In button
        const googleButtonContainer = document.getElementById("google-signin-button");
        if (googleButtonContainer) {
          window.google.accounts.id.renderButton(googleButtonContainer, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "signin_with",
            shape: "rectangular",
          });
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      setError("");
      
      // The credential is in the credential property of the response
      const { credential } = response;
      
      // Call the loginWithGoogle function from the auth context
      const result = await loginWithGoogle(credential);
      
      // Check if phone verification is needed
      if (result.needs_phone_verification) {
        setShowPhoneVerification(true);
      } else {
        // Get redirect URL from query params or default to home
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/';
        navigate(redirectTo);
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.response?.data?.error || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      
      // Get redirect URL from query params or default to home
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirect') || '/';
      
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (showPhoneVerification) {
    return (
      <div className="flex flex-col min-h-screen bg-white-100">
        <HeaderByAnima showHeroSection={false} />
        
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <PhoneVerification 
            onVerificationComplete={() => {
              // Get redirect URL from query params or default to home
              const urlParams = new URLSearchParams(window.location.search);
              const redirectTo = urlParams.get('redirect') || '/';
              navigate(redirectTo);
            }} 
          />
        </main>
        
        <CtaFooterByAnima />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white-100">
      <HeaderByAnima showHeroSection={false} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primarymain hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-6">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-primarymain hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="h-4 w-4 text-primarymain border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember for 30 days
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primarymain hover:bg-primarymain/90 text-white rounded-lg"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Google Sign-In Button */}
              <div id="google-signin-button" className="h-12 w-full"></div>
            </div>
          </form>
        </div>
      </main>

      <CtaFooterByAnima />
    </div>
  );
}; 