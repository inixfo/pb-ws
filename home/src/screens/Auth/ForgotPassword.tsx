import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { HeaderByAnima } from "../ElectronicsStore/sections/HeaderByAnima/HeaderByAnima";
import { CtaFooterByAnima } from "../ElectronicsStore/sections/CtaFooterByAnima/CtaFooterByAnima";
import { ArrowLeftIcon, CheckCircleIcon } from "lucide-react";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // This would be implemented in the API service
      // await authService.forgotPassword(email);
      
      // For now, just simulate a successful request
      setTimeout(() => {
        setSubmitted(true);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send password reset email. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white-100">
      <HeaderByAnima showHeroSection={false} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!submitted ? (
            <>
              <div className="flex flex-col items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
                <p className="text-gray-600 text-center">
                  No worries, we'll send you reset instructions.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-12 border-gray-300 rounded-lg"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primarymain hover:bg-primarymain/90 text-white rounded-lg"
                >
                  {loading ? "Sending..." : "Reset Password"}
                </Button>

                <div className="flex justify-center">
                  <Link
                    to="/signin"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-600 max-w-sm">
                We have sent a password reset link to <span className="font-medium">{email}</span>.
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  Didn't receive the email?{" "}
                  <button
                    type="button"
                    className="text-primarymain hover:underline"
                    onClick={() => setSubmitted(false)}
                  >
                    Click to resend
                  </button>
                </p>
              </div>
              <div className="pt-4">
                <Link
                  to="/signin"
                  className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <CtaFooterByAnima />
    </div>
  );
}; 