'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { PageTransition, FadeIn } from '@/components/PageTransition';
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { ValidationUtils } from '@/utils';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { signUp } = useAuth();
  const router = useRouter();

  const passwordValidation = ValidationUtils.validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!ValidationUtils.isValidEmail(formData.email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const success = await signUp(formData.email, formData.password, formData.fullName);
    
    if (success) {
      setSuccess('Account created successfully! Please check your email to verify your account.');
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } else {
      setError('Failed to create account. Please try again.');
    }
    
    setIsLoading(false);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <FadeIn>
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-bold text-foreground">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Or{' '}
                <Link
                  href="/auth/signin"
                  className="font-medium text-primary hover:text-primary/80"
                >
                  sign in to your existing account
                </Link>
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <div key={index} className="flex items-center text-xs">
                          <XCircle className="h-3 w-3 text-red-500 mr-1" />
                          <span className="text-red-600">{error}</span>
                        </div>
                      ))}
                      {passwordValidation.isValid && (
                        <div className="flex items-center text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-green-600">Password meets all requirements</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  
                  {formData.confirmPassword && (
                    <div className="mt-1 flex items-center text-xs">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 text-red-500 mr-1" />
                          <span className="text-red-600">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
                  {success}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}