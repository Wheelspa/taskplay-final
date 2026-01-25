import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Zap, ArrowLeft, AlertCircle, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const UpgradePage = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("premium_yearly");
  const [billingCycle, setBillingCycle] = useState("yearly");
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  
  // Check if user was redirected from a premium feature
  const featureRequested = searchParams.get("feature");

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }
    
    setValidatingCode(true);
    setDiscountError("");
    
    try {
      const response = await axios.post(`${API}/discount/validate?code=${encodeURIComponent(discountCode)}`);
      if (response.data.valid) {
        setDiscountApplied(true);
        setDiscountError("");
        toast.success(`${response.data.description} applied!`);
      } else {
        setDiscountApplied(false);
        setDiscountError(response.data.error || "Invalid discount code");
      }
    } catch (error) {
      setDiscountApplied(false);
      setDiscountError(error.response?.data?.detail || "Failed to validate discount code");
    } finally {
      setValidatingCode(false);
    }
  };

  const plans = {
    basic: {
      name: "Basic",
      icon: <Zap className="w-6 h-6" />,
      monthly: { price: 90, amount: 9000, id: "basic_monthly" },
      yearly: { price: 499, amount: 49900, id: "basic_yearly", savings: "Save ₹581" },
      features: [
        "Up to 50 tasks/month",
        "Basic analytics",
        "Email support"
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
        "Calendar view",
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

  const getSelectedPlanDetails = () => {
    const planType = selectedPlan.includes("basic") ? "basic" : "premium";
    const cycle = selectedPlan.includes("monthly") ? "monthly" : "yearly";
    const basePlan = plans[planType][cycle];
    
    let finalPrice = basePlan.price;
    let finalAmount = basePlan.amount;
    
    if (discountApplied && VALID_DISCOUNT_CODES[discountCode.toUpperCase()]) {
      const discountPercent = VALID_DISCOUNT_CODES[discountCode.toUpperCase()].discount;
      finalPrice = Math.round(basePlan.price * (1 - discountPercent / 100));
      finalAmount = Math.round(basePlan.amount * (1 - discountPercent / 100));
    }
    
    return {
      ...basePlan,
      originalPrice: basePlan.price,
      price: finalPrice,
      amount: finalAmount,
      type: planType,
      cycle: cycle
    };
  };

  const applyDiscountCode = () => {
    const code = discountCode.toUpperCase().trim();
    const validation = isDiscountCodeValid(code);
    
    if (validation.valid) {
      setDiscountApplied(true);
      setDiscountError("");
      toast.success(`🎉 ${validation.discountInfo.label} applied!`);
    } else {
      setDiscountApplied(false);
      setDiscountError(validation.reason);
    }
  };

  const removeDiscount = () => {
    setDiscountCode("");
    setDiscountApplied(false);
    setDiscountError("");
  };

  const handleUpgrade = async () => {
    setLoading(true);
    const planDetails = getSelectedPlanDetails();
    
    try {
      // Create payment order
      const orderResponse = await axios.post(`${API}/payment/create-order`, {
        amount: planDetails.amount
      });

      // Mock payment flow
      if (orderResponse.data.mock) {
        const mockPaymentId = `mock_pay_${Date.now()}`;
        const mockSignature = `mock_sig_${Date.now()}`;

        try {
          // Call upgrade endpoint
          const upgradeResponse = await axios.post(`${API}/membership/upgrade`, {
            membership_plan: selectedPlan,
            payment_order_id: orderResponse.data.order_id,
            payment_id: mockPaymentId,
            payment_signature: mockSignature
          });

          // Update local user state
          setUser(upgradeResponse.data.user);
          toast.success(`🎉 ${upgradeResponse.data.message}`);
          navigate("/dashboard");
        } catch (error) {
          toast.error(error.response?.data?.detail || "Upgrade failed");
        } finally {
          setLoading(false);
        }
        return;
      }

      // Real Razorpay payment flow
      const options = {
        key: "rzp_test_yourkeyhere",
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "TaskPro",
        description: `Upgrade to ${planDetails.type.charAt(0).toUpperCase() + planDetails.type.slice(1)} - ${planDetails.cycle.charAt(0).toUpperCase() + planDetails.cycle.slice(1)}`,
        order_id: orderResponse.data.order_id,
        handler: async function (response) {
          try {
            const upgradeResponse = await axios.post(`${API}/membership/upgrade`, {
              membership_plan: selectedPlan,
              payment_order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              payment_signature: response.razorpay_signature
            });

            setUser(upgradeResponse.data.user);
            toast.success("Upgrade successful!");
            navigate("/dashboard");
          } catch (error) {
            toast.error("Upgrade failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone
        },
        theme: {
          color: "#0047AB"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error("Failed to initiate payment");
      setLoading(false);
    }
  };

  const handlePlanSelect = (planType) => {
    setSelectedPlan(`${planType}_${billingCycle}`);
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    const planType = selectedPlan.includes("basic") ? "basic" : "premium";
    setSelectedPlan(`${planType}_${cycle}`);
  };

  // Check if user already has this plan
  const isCurrentPlan = (planType) => {
    return user?.membership_type === planType;
  };

  return (
    <div className="min-h-screen bg-secondary px-6 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="upgrade-heading">
            UPGRADE YOUR PLAN
          </h1>
          <p className="text-muted-foreground">
            {user?.membership_type 
              ? `Currently on ${user.membership_type.charAt(0).toUpperCase() + user.membership_type.slice(1)} plan`
              : "Choose a plan to unlock premium features"}
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-background border border-border rounded-full p-1 inline-flex">
            <button
              type="button"
              onClick={() => handleBillingCycleChange("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
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
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              onClick={() => !isCurrentPlan(key) && handlePlanSelect(key)}
              className={`relative bg-background border-2 rounded-sm p-6 transition-all ${
                isCurrentPlan(key) 
                  ? "border-green-500 opacity-75 cursor-not-allowed"
                  : selectedPlan.includes(key)
                  ? `${plan.color} shadow-lg cursor-pointer`
                  : "border-border hover:border-primary/50 cursor-pointer"
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

              {isCurrentPlan(key) && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Current Plan
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

        {/* Discount Code & Payment Section */}
        <div className="bg-background border border-border rounded-sm p-8">
          {/* Discount Code */}
          <div className="border border-dashed border-border rounded-sm p-4 mb-6">
            <Label className="text-sm font-medium">HAVE A DISCOUNT CODE?</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                placeholder="Enter code (e.g., EARLYBIRD)"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountError("");
                  if (discountApplied) setDiscountApplied(false);
                }}
                disabled={discountApplied}
                className="flex-1"
              />
              {discountApplied ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={removeDiscount}
                  className="text-red-600"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyDiscountCode}
                  disabled={!discountCode.trim()}
                >
                  Apply
                </Button>
              )}
            </div>
            {discountError && (
              <p className="text-red-500 text-xs mt-1">{discountError}</p>
            )}
            {discountApplied && VALID_DISCOUNT_CODES[discountCode.toUpperCase()] && (
              <p className="text-green-600 text-xs mt-1 font-medium">
                ✓ {VALID_DISCOUNT_CODES[discountCode.toUpperCase()].label}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              🎁 <strong>EARLYBIRD</strong> - 50% off! Expires Feb 28, 2025
            </p>
          </div>

          {/* Payment Summary */}
          <div className="bg-accent/10 border border-accent p-4 rounded-sm mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {selectedPlan.includes("basic") ? "Basic" : "Premium"} Plan - {billingCycle === "yearly" ? "Yearly" : "Monthly"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Testing mode: Mock payment will be used (no real charges)
                </p>
              </div>
              <div className="text-right">
                {discountApplied && (
                  <p className="text-sm text-muted-foreground line-through">
                    ₹{getSelectedPlanDetails().originalPrice}
                  </p>
                )}
                <p className="text-2xl font-bold text-green-600">
                  ₹{getSelectedPlanDetails().price}
                </p>
                {discountApplied && (
                  <p className="text-xs text-green-600 font-medium">50% OFF applied!</p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpgrade}
            className="w-full uppercase tracking-wider h-12"
            disabled={loading || isCurrentPlan(selectedPlan.split("_")[0])}
            data-testid="upgrade-submit-btn"
          >
            {loading ? "PROCESSING..." : `PAY ₹${getSelectedPlanDetails().price} & UPGRADE`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
