import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, Mail, Cookie, UserCheck, AlertTriangle } from "lucide-react";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const lastUpdated = "February 20, 2026";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-2xl font-bold tracking-tight cursor-pointer"
              onClick={() => navigate("/")}
            >
              TASKPLAY
            </h1>
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introduction */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to TaskPlay ("we," "our," or "us"). We are committed to protecting your personal information 
              and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you use our task management application and related services.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              By using TaskPlay, you agree to the collection and use of information in accordance with this policy. 
              If you do not agree with the terms of this privacy policy, please do not access the application.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Information We Collect
            </h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We collect personal information that you voluntarily provide when registering for an account:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Password (encrypted)</li>
              <li>Payment information (processed securely via Razorpay)</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Task Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you use our service, we collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Task titles, descriptions, and details</li>
              <li>Scheduled dates and times</li>
              <li>Priority levels and status</li>
              <li>Location data (only if you choose to add locations to tasks)</li>
              <li>Assignee information</li>
              <li>Team and group associations</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Automatically Collected Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              We automatically collect certain information when you visit or use our application:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>IP address</li>
              <li>Usage data (pages visited, features used)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li><strong>Provide Services:</strong> To create and manage your account, process tasks, and deliver our core functionality</li>
              <li><strong>Process Payments:</strong> To handle subscription payments and billing through our payment processor (Razorpay)</li>
              <li><strong>Improve Services:</strong> To understand how users interact with our application and improve user experience</li>
              <li><strong>Communication:</strong> To send you service-related notifications, updates, and promotional materials (with your consent)</li>
              <li><strong>Security:</strong> To detect, prevent, and address technical issues and security threats</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary" />
              Data Sharing and Disclosure
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li><strong>Service Providers:</strong> With third-party vendors who assist us in operating our service (e.g., Razorpay for payments, cloud hosting providers)</li>
              <li><strong>Team Members:</strong> Task information may be shared with team members you collaborate with</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          {/* Payment Information */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Payment Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              All payment processing is handled by Razorpay, a PCI-DSS compliant payment processor. 
              We do not store your complete credit card or debit card information on our servers. 
              Payment data is encrypted and transmitted securely to Razorpay for processing.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              For more information about Razorpay's security practices, please visit: 
              <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                Razorpay Privacy Policy
              </a>
            </p>
          </section>

          {/* Cookies */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Cookie className="w-6 h-6 text-primary" />
              Cookies and Tracking
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our application and store certain information. 
              These technologies are used for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li><strong>Authentication:</strong> To keep you logged in</li>
              <li><strong>Preferences:</strong> To remember your settings and preferences</li>
              <li><strong>Analytics:</strong> To understand how you use our application</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can instruct your browser to refuse all cookies or indicate when a cookie is being sent. 
              However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          {/* Data Retention */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Data Retention
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. 
              We will retain and use your information as necessary to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li>Comply with our legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Completed tasks are automatically cleared at the beginning of each month as part of our monthly cleanup feature.
            </p>
          </section>

          {/* Your Rights */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-primary" />
              Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4 space-y-2">
              <li><strong>Access:</strong> Request access to your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Withdrawal:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise any of these rights, please contact us using the information provided below.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-primary" />
              Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not intended for use by children under the age of 13. We do not knowingly collect 
              personal information from children under 13. If you are a parent or guardian and believe your child 
              has provided us with personal information, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6 text-primary" />
              Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review 
              this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-primary" />
              Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-6 bg-secondary rounded-sm">
              <p className="font-medium">TaskPlay Support</p>
              <p className="text-muted-foreground mt-2">Email: support@taskplay.com</p>
              <p className="text-muted-foreground">Website: www.taskplay.com</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 TaskPlay. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Button variant="link" onClick={() => navigate("/terms")} className="text-sm">
              Terms of Service
            </Button>
            <Button variant="link" onClick={() => navigate("/")} className="text-sm">
              Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
