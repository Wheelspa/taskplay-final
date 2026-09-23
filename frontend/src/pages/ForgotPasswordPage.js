import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, CheckCircle2, KeyRound, Mail, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim() });
      toast.success("If an account exists with this email, an OTP code has been sent!");
      setStep(2);
      setResendTimer(60); // 60s cooldown for resend
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/verify-otp`, {
        email: email.trim(),
        otp_code: otp.trim(),
      });
      toast.success("OTP verified! Please set your new password.");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        email: email.trim(),
        otp_code: otp.trim(),
        new_password: newPassword,
      });
      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/auth")}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 p-0 h-auto hover:bg-transparent"
            data-testid="back-to-login-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Login</span>
          </Button>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground uppercase" data-testid="forgot-password-heading">
            {step === 1 && "FORGOT PASSWORD"}
            {step === 2 && "VERIFY OTP CODE"}
            {step === 3 && "RESET PASSWORD"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 1 && "Enter your email address to receive a 6-digit verification code."}
            {step === 2 && `We sent a 6-digit OTP code to ${email}`}
            {step === 3 && "Create a new strong password for your TaskPlay account."}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {/* STEP 1: REQUEST OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    data-testid="forgot-email-input"
                    className="pl-10"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full uppercase tracking-wider h-12 font-semibold"
                disabled={loading}
                data-testid="send-otp-btn"
              >
                {loading ? "SENDING CODE..." : "SEND VERIFICATION CODE"}
              </Button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="flex flex-col items-center">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Enter 6-Digit OTP Code
                </Label>

                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  data-testid="otp-input"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                className="w-full uppercase tracking-wider h-12 font-semibold"
                disabled={loading || otp.length !== 6}
                data-testid="verify-otp-btn"
              >
                {loading ? "VERIFYING..." : "VERIFY & CONTINUE"}
              </Button>

              <div className="text-center pt-2 border-t border-border/60">
                {resendTimer > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Resend code available in <span className="font-semibold text-foreground">{resendTimer}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={loading}
                    className="text-xs font-semibold text-primary hover:underline"
                    data-testid="resend-otp-btn"
                  >
                    Didn't receive a code? Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  New Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    data-testid="new-password-input"
                    className="pl-10"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm New Password
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    data-testid="confirm-password-input"
                    className="pl-10"
                  />
                  <ShieldCheck className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full uppercase tracking-wider h-12 font-semibold"
                disabled={loading}
                data-testid="reset-password-btn"
              >
                {loading ? "RESETTING PASSWORD..." : "UPDATE PASSWORD"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
