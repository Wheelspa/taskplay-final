import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, MapPin, Phone, TrendingUp } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="logo">TASKPLAY</h1>
          <div className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/auth")}
              data-testid="login-btn"
            >
              LOGIN
            </Button>
            <Button
              onClick={() => navigate("/auth?mode=register")}
              data-testid="get-started-btn"
            >
              GET STARTED
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Brand Ambassador - Left Side */}
          <div className="lg:col-span-4 flex justify-center lg:justify-start">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl"></div>
              <img
                src="https://customer-assets.emergentagent.com/job_taskflow-pro-95/artifacts/mrfodckx_Gemini_Generated_Image_xk0v49xk0v49xk0v.png"
                alt="TaskPlay Brand Ambassador"
                className="relative w-72 h-auto rounded-sm shadow-2xl"
                data-testid="brand-ambassador-img"
              />
              <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-4 py-2 rounded-sm shadow-lg">
                <p className="text-xs font-bold uppercase tracking-wide">Trusted by 10,000+</p>
                <p className="text-xs">Professionals</p>
              </div>
            </div>
          </div>

          {/* Hero Content - Center/Right */}
          <div className="lg:col-span-8">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-none mb-6" data-testid="hero-heading">
              MANAGE TASKS WITH PRECISION
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-8" data-testid="hero-description">
              Schedule, assign, and track tasks with built-in phone calling and location mapping. Perfect for teams that need coordinated task management.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Button
                size="lg"
                className="uppercase tracking-wider h-12"
                onClick={() => navigate("/auth?mode=register")}
                data-testid="hero-cta-btn"
              >
                START MANAGING TASKS
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="uppercase tracking-wider h-12"
                onClick={() => navigate("/auth")}
              >
                LOGIN
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Free trial available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-4xl md:text-5xl font-semibold tracking-tight mb-16" data-testid="features-heading">
            FEATURES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-border bg-background p-8 rounded-sm" data-testid="feature-scheduling">
              <Calendar className="w-10 h-10 mb-4 text-primary" />
              <h4 className="text-2xl font-medium mb-3">TASK SCHEDULING</h4>
              <p className="text-muted-foreground leading-relaxed">
                Schedule tasks with date and time. Postpone or prepone with ease. Set priorities to focus on what matters.
              </p>
            </div>
            <div className="border border-border bg-background p-8 rounded-sm" data-testid="feature-location">
              <MapPin className="w-10 h-10 mb-4 text-primary" />
              <h4 className="text-2xl font-medium mb-3">LOCATION MAPPING</h4>
              <p className="text-muted-foreground leading-relaxed">
                Interactive map picker for precise location tagging. Every task can have a physical location attached.
              </p>
            </div>
            <div className="border border-border bg-background p-8 rounded-sm" data-testid="feature-calling">
              <Phone className="w-10 h-10 mb-4 text-primary" />
              <h4 className="text-2xl font-medium mb-3">CLICK-TO-CALL</h4>
              <p className="text-muted-foreground leading-relaxed">
                One-click phone dialing for task assignees. Seamlessly coordinate with your team members.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-4xl md:text-5xl font-semibold tracking-tight mb-8" data-testid="pricing-heading">
            SIMPLE PRICING
          </h3>
          <div className="border border-border bg-secondary p-12 rounded-sm inline-block">
            <div className="text-sm font-medium tracking-wide uppercase text-muted-foreground mb-4">
              ONE-TIME PAYMENT
            </div>
            <div className="text-5xl font-bold mb-6" data-testid="price">₹499</div>
            <ul className="text-left mb-8 space-y-3">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Unlimited task creation</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Priority management</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Location mapping</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Click-to-call integration</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Task scheduling</span>
              </li>
            </ul>
            <Button
              size="lg"
              className="w-full uppercase tracking-wider h-12"
              onClick={() => navigate("/auth?mode=register")}
              data-testid="pricing-cta-btn"
            >
              CREATE ACCOUNT
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground">
          <p>© 2026 TASKPLAY. Professional task management for modern teams.</p>
          <div className="flex justify-center gap-6 mt-4">
            <button 
              onClick={() => navigate("/privacy")} 
              className="text-sm hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => navigate("/auth")} 
              className="text-sm hover:text-primary transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;