import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

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
        </div>
      </main>

      <CtaFooterByAnima />
    </div>
  );
}; 