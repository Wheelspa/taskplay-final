import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  Users,
  Star,
  Sparkles,
  Clock,
  Pin,
  CheckSquare,
  Shield,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Navigation - Fixed at top of viewport */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2" data-testid="logo">
            <CheckSquare className="w-6 h-6 text-primary" />
            <span>TASKPLAY</span>
          </h1>
          <div className="flex items-center gap-3">
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

      {/* Redesigned Hero Section */}
      <section className="pt-16 pb-20 px-6 md:px-12 overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Side: Hero Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Task & Team Orchestration</span>
            </div>

            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-foreground"
              data-testid="hero-heading"
            >
              MANAGE TASKS WITH <span className="text-primary">PRECISION</span>
            </h2>

            <p
              className="text-base sm:text-lg leading-relaxed text-muted-foreground"
              data-testid="hero-description"
            >
              Schedule, assign, and track tasks with built-in phone calling and location mapping. Perfect for teams that need coordinated task management.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                size="lg"
                className="uppercase tracking-wider h-12 px-8 shadow-md"
                onClick={() => navigate("/auth?mode=register")}
                data-testid="hero-cta-btn"
              >
                START MANAGING TASKS
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="uppercase tracking-wider h-12 px-8"
                onClick={() => navigate("/auth")}
              >
                LOGIN
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Free trial available</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Available on web, no install needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Get started in under a minute</span>
              </div>
            </div>
          </div>

          {/* Right Side: Product Mockup Visual */}
          <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-3xl blur-2xl opacity-70"></div>

            {/* Main Mockup Card */}
            <div
              className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden transform lg:-rotate-1 lg:hover:rotate-0 transition-transform duration-300"
              data-testid="dashboard-mockup"
            >
              {/* Window Bar */}
              <div className="bg-muted/80 border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                  TaskPlay Dashboard
                </span>
                <div className="w-8"></div>
              </div>

              {/* Dashboard Content Mockup */}
              <div className="p-5 space-y-4 bg-background/50">
                {/* Mini Stat Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="bg-background border border-border p-3 rounded-lg shadow-xs">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Total</div>
                    <div className="text-lg font-bold text-foreground mt-0.5">24</div>
                  </div>
                  <div className="bg-orange-50/60 border border-orange-200 p-3 rounded-lg shadow-xs">
                    <div className="text-[10px] uppercase font-semibold text-orange-700">Pending</div>
                    <div className="text-lg font-bold text-orange-950 mt-0.5">5</div>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200 p-3 rounded-lg shadow-xs">
                    <div className="text-[10px] uppercase font-semibold text-emerald-700">Completed</div>
                    <div className="text-lg font-bold text-emerald-950 mt-0.5">19</div>
                  </div>
                </div>

                {/* Mockup Task Section Header */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    My Active Tasks
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                    Live Updates
                  </span>
                </div>

                {/* Task Item 1 */}
                <div className="bg-background border border-border p-3 rounded-lg shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">Client Q3 Presentation</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold">HIGH</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" /> Due Today at 5:00 PM</span>
                        <span>•</span>
                        <span>Assigned to Alex</span>
                      </div>
                    </div>
                    <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  </div>
                </div>

                {/* Task Item 2 */}
                <div className="bg-background border border-border p-3 rounded-lg shadow-xs hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">Site Location Inspection</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">IN PROGRESS</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> Downtown HQ</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-emerald-500" /> +1 555-0192</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Item 3 */}
                <div className="bg-background border border-border p-3 rounded-lg shadow-xs opacity-80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground line-through text-muted-foreground">Weekly Team Sync</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 font-bold">DONE</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6 md:px-12 bg-secondary">
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

      <section id="pricing" className="py-24 px-6 md:px-12 bg-gradient-to-b from-background via-primary/5 to-background border-t border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h3 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4" data-testid="pricing-heading">
              SIMPLE PRICING
            </h3>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Simple, transparent pricing — no hidden fees or surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-4xl mx-auto">
            {/* Why teams choose TaskPlay mini-list */}
            <div className="lg:col-span-6 bg-card border border-border p-8 rounded-lg flex flex-col justify-center space-y-6 shadow-xs">
              <h4 className="text-xl font-bold tracking-tight text-foreground">
                Why teams choose TaskPlay
              </h4>
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">No hidden fees</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">Transparent flat pricing with complete access to all feature capabilities.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">Cancel anytime</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">Total flexibility for your workspace with no long-term contracts.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-foreground text-sm">Setup in minutes</h5>
                    <p className="text-xs text-muted-foreground mt-0.5">Get your team onboarded immediately with intuitive workspace tools.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Pricing Card */}
            <div className="lg:col-span-6 border border-border bg-secondary p-8 sm:p-10 rounded-lg shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-sm font-medium tracking-wide uppercase text-muted-foreground mb-3">
                  ONE-TIME PAYMENT
                </div>
                <div className="text-5xl font-bold mb-6 text-foreground" data-testid="price">₹499</div>
                <ul className="text-left mb-8 space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Unlimited task creation</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Priority management</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Location mapping</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Click-to-call integration</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>Task scheduling</span>
                  </li>
                </ul>
              </div>
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
        </div>
      </section>

      <footer className="border-t border-border bg-secondary pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* 3-Column Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12">
            {/* Column 1: Logo & Tagline */}
            <div className="space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary" />
                <span>TASKPLAY</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Professional task management for modern teams.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-primary transition-colors"
                  >
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Account */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold tracking-wider uppercase text-foreground">
                Account
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button
                    onClick={() => navigate("/auth")}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate("/admin/login")}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-primary transition-colors text-left"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Login</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2026 TASKPLAY. Professional task management for modern teams.</p>
            <button
              onClick={() => navigate("/privacy")}
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;