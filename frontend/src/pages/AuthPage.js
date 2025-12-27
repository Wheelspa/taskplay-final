import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, setAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AuthPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "login");
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: ""
  });
  
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    name: "",
    phone: ""
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      setAuthToken(response.data.access_token);
      setUser(response.data.user);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    setPaymentProcessing(true);
    try {
      const orderResponse = await axios.post(`${API}/payment/create-order`, {
        amount: 49900
      });

      const options = {
        key: "rzp_test_yourkeyhere",
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "TaskPro",
        description: "Account Registration",
        order_id: orderResponse.data.order_id,
        handler: async function (response) {
          try {
            await axios.post(`${API}/payment/verify`, {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });

            const registerResponse = await axios.post(`${API}/auth/register`, {
              ...registerData,
              payment_order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              payment_signature: response.razorpay_signature
            });

            setAuthToken(registerResponse.data.access_token);
            setUser(registerResponse.data.user);
            toast.success("Registration successful!");
            navigate("/dashboard");
          } catch (error) {
            toast.error("Payment verification failed");
          } finally {
            setPaymentProcessing(false);
          }
        },
        prefill: {
          name: registerData.name,
          email: registerData.email,
          contact: registerData.phone
        },
        theme: {
          color: "#0047AB"
        },
        modal: {
          ondismiss: function() {
            setPaymentProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment");
      setPaymentProcessing(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.name || !registerData.phone) {
      toast.error("Please fill all fields");
      return;
    }

    initiatePayment();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-secondary">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="auth-heading">
            {mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Sign in to your TaskPro account"
              : "Register and pay ₹499 to start"}
          </p>
        </div>

        <div className="bg-background border border-border rounded-sm p-8">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email">EMAIL</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  data-testid="login-email-input"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="password">PASSWORD</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  data-testid="login-password-input"
                  className="mt-2"
                />
              </div>
              <Button
                type="submit"
                className="w-full uppercase tracking-wider h-12"
                disabled={loading}
                data-testid="login-submit-btn"
              >
                {loading ? "LOGGING IN..." : "LOGIN"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <Label htmlFor="name">NAME</Label>
                <Input
                  id="name"
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                  data-testid="register-name-input"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="reg-email">EMAIL</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                  data-testid="register-email-input"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="phone">PHONE</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                  data-testid="register-phone-input"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="reg-password">PASSWORD</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  data-testid="register-password-input"
                  className="mt-2"
                />
              </div>
              <div className="bg-accent/10 border border-accent p-4 rounded-sm">
                <p className="text-sm text-accent-foreground">
                  Registration fee: <strong>₹499</strong> (One-time payment)
                </p>
              </div>
              <Button
                type="submit"
                className="w-full uppercase tracking-wider h-12"
                disabled={paymentProcessing}
                data-testid="register-submit-btn"
              >
                {paymentProcessing ? "PROCESSING..." : "PROCEED TO PAYMENT"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-sm text-primary hover:underline"
              data-testid="auth-mode-toggle"
            >
              {mode === "login"
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground"
            data-testid="back-to-home-btn"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;