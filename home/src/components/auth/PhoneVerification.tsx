import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';

interface PhoneVerificationProps {
  onVerificationComplete?: () => void;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({ onVerificationComplete }) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const { verifyPhone, verifyCode } = useAuth();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await verifyPhone(phone);
      setCodeSent(true);
      setSentPhone(result.phone);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await verifyCode(code, sentPhone);
      if (onVerificationComplete) {
        onVerificationComplete();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {codeSent ? 'Enter Verification Code' : 'Verify Your Phone Number'}
        </h2>
        <p className="text-gray-600">
          {codeSent 
            ? 'We\'ve sent a verification code to your phone. Please enter it below.'
            : 'To complete your registration, we need to verify your phone number.'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!codeSent ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primarymain hover:bg-primarymain/90"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primarymain hover:bg-primarymain/90"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode('');
              }}
              className="text-sm text-primarymain hover:underline"
            >
              Use a different phone number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}; 