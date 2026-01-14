import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API, setAuthToken } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Zap } from "lucide-react";
import { toast } from "sonner";

const AuthPage = ({ setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get("mode") || "login");
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("basic_yearly");
  const [billingCycle, setBillingCycle] = useState("yearly");
  
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

  const plans = {
    basic: {
      name: "Basic",
      icon: <Zap className="w-6 h-6" />,
      monthly: { price: 90, amount: 9000, id: "basic_monthly" },
      yearly: { price: 499, amount: 49900, id: "basic_yearly", savings: "Save ₹581" },
      features: [
        "Up to 50 tasks/month",
        "Basic analytics",
        "Email support",
        "Calendar view"
      ],
      color: "border-blue-500",
      bgColor: "bg-blue-50"
    },
    premium: {
      name: "Premium",
      icon: <Crown className="w-6 h-6" />,
      monthly: { price: 180, amount: 18000, id: "premium_monthly" },
      yearly: { price: 999, amount: 99900, id: "premium_yearly", savings: "Save ₹1,161" },
      features: [
        "Unlimited tasks",
        "Advanced analytics",
        "Team collaboration",
        "Priority support",
        "Custom reports",
        "API access"
      ],
      color: "border-purple-500",
      bgColor: "bg-purple-50",
      popular: true
    }
  };

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

  const getSelectedPlanDetails = () => {
    const planType = selectedPlan.includes("basic") ? "basic" : "premium";
    const cycle = selectedPlan.includes("monthly") ? "monthly" : "yearly";
    return {
      ...plans[planType][cycle],
      type: planType,
      cycle: cycle
    };
  };

  const initiatePayment = async () => {
    setPaymentProcessing(true);
    const planDetails = getSelectedPlanDetails();
    
    try {
      const orderResponse = await axios.post(`${API}/payment/create-order`, {
        amount: planDetails.amount
      });

      // Check if it's mock payment
      if (orderResponse.data.mock) {
        const mockPaymentId = `mock_pay_${Date.now()}`;
        const mockSignature = `mock_sig_${Date.now()}`;

        try {
          await axios.post(`${API}/payment/verify`, {
            order_id: orderResponse.data.order_id,
            payment_id: mockPaymentId,
            signature: mockSignature
          });

          const registerResponse = await axios.post(`${API}/auth/register`, {
            ...registerData,
            membership_plan: selectedPlan,
            payment_order_id: orderResponse.data.order_id,
            payment_id: mockPaymentId,
            payment_signature: mockSignature
          });

          setAuthToken(registerResponse.data.access_token);
          setUser(registerResponse.data.user);
          toast.success(`Welcome! You're now a ${planDetails.type.charAt(0).toUpperCase() + planDetails.type.slice(1)} member!`);
          navigate("/dashboard");
        } catch (error) {
          toast.error("Payment verification failed");
        } finally {
          setPaymentProcessing(false);
        }
        return;
      }

      // Real Razorpay payment flow
      const options = {
        key: "rzp_test_yourkeyhere",
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "TaskPro",
        description: `${planDetails.type.charAt(0).toUpperCase() + planDetails.type.slice(1)} - ${planDetails.cycle.charAt(0).toUpperCase() + planDetails.cycle.slice(1)}`,
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
              membership_plan: selectedPlan,
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

  const handlePlanSelect = (planType) => {
    setSelectedPlan(`${planType}_${billingCycle}`);
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    const planType = selectedPlan.includes("basic") ? "basic" : "premium";
    setSelectedPlan(`${planType}_${cycle}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-secondary">
      <div className={`w-full ${mode === "register" ? "max-w-4xl" : "max-w-md"}`}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="auth-heading">
            {mode === "login" ? "LOGIN" : "CREATE ACCOUNT"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login"
              ? "Sign in to your TaskPro account"
              : "Choose a plan and get started"}
          </p>
        </div>

        {mode === "login" ? (
          <div className="bg-background border border-border rounded-sm p-8">
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
            
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-sm text-primary hover:underline"
                data-testid="auth-mode-toggle"
              >
                Don't have an account? Register
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Billing Cycle Toggle */}
            <div className="flex justify-center">
              <div className="bg-background border border-border rounded-full p-1 inline-flex">
                <button
                  type="button"
                  onClick={() => handleBillingCycleChange("monthly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="billing-monthly-btn"
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => handleBillingCycleChange("yearly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid="billing-yearly-btn"
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plans */}
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  onClick={() => handlePlanSelect(key)}
                  className={`relative bg-background border-2 rounded-sm p-6 cursor-pointer transition-all ${
                    selectedPlan.includes(key)
                      ? `${plan.color} shadow-lg`
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`plan-${key}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-sm ${plan.bgColor}`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">₹{plan[billingCycle].price}</span>
                      <span className="text-muted-foreground">/{billingCycle === "yearly" ? "year" : "month"}</span>
                    </div>
                    {billingCycle === "yearly" && plan.yearly.savings && (
                      <span className="text-sm text-green-600 font-medium">
                        {plan.yearly.savings}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className={`w-full h-1 rounded-full ${
                    selectedPlan.includes(key) ? plan.color.replace("border-", "bg-") : "bg-muted"
                  }`} />
                </div>
              ))}
            </div>

            {/* Registration Form */}
            <div className="bg-background border border-border rounded-sm p-8">
              <h3 className="text-lg font-semibold mb-4">Your Details</h3>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
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
                </div>

                <div className="bg-accent/10 border border-accent p-4 rounded-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {selectedPlan.includes("basic") ? "Basic" : "Premium"} Plan - {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 Testing mode: Mock payment will be used (no real charges)
                      </p>
                    </div>
                    <p className="text-2xl font-bold">
                      ₹{getSelectedPlanDetails().price}
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full uppercase tracking-wider h-12"
                  disabled={paymentProcessing}
                  data-testid="register-submit-btn"
                >
                  {paymentProcessing ? "PROCESSING..." : `PAY ₹${getSelectedPlanDetails().price} & REGISTER`}
                </Button>
              </form>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-primary hover:underline"
                data-testid="auth-mode-toggle"
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
