import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useUser } from "@/context/UserContext";
import { API_BASE_URL } from "@/lib/api";

const Auth = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [isLoading, setIsLoading] = useState(false);

  // Password visibility — separate states for each field
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

// SIGNUP STATE 
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupOtp, setSignupOtp] = useState("");

//FORGOT PASSWORD STATE 
  // 0 = hidden, 1 = enter email, 2 = enter OTP, 3 = enter new password
  const [forgotStep, setForgotStep] = useState<0 | 1 | 2 | 3>(0);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//LOGIN
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const email = (document.getElementById("login-email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("login-password") as HTMLInputElement).value;

    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Login successful!");

        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          image: data.user.image,
        };

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        if (userData.role === "owner") navigate("/owner-dashboard");
        else navigate("/user-dashboard");
      } else {
        toast.error(data.message || "Invalid credentials");
      }
    } catch {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
     //SIGNUP — Step 1: Submit email + password

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const email = (document.getElementById("signup-email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("signup-password") as HTMLInputElement).value;

    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "user" }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent to your email");
        setSignupEmail(email);
        setSignupStep(2);
      } else {
        toast.error(data.message || "Signup failed");
      }
    } catch {
      toast.error("Server error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  
  //   SIGNUP — Step 2: Verify OTP

  const handleSignupOtpVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (signupOtp.length !== 6) {
      toast.error("OTP must be 6 digits");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail, otp: signupOtp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Email verified! Please log in.");
        setSignupStep(1);
        setSignupOtp("");
        setSignupEmail("");
      } else {
        toast.error(data.message || "OTP verification failed");
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  
     //FORGOT PASSWORD — Step 1: Send OTP

  const sendForgotOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!emailRegex.test(forgotEmail)) {
      toast.error("Enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP sent to your email");
        setForgotStep(2);
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


//     FORGOT PASSWORD — Step 2: Verify OTP

  const verifyForgotOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (forgotOtp.length !== 6) {
      toast.error("OTP must be 6 digits");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("OTP verified");
        setForgotStep(3);
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


//     FORGOT PASSWORD — Step 3: Reset Password

  const resetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Password reset successful! Please log in.");
        // Reset all forgot password state
        setForgotStep(0);
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
        setShowNewPassword(false);
      } else {
        toast.error(data.message || "Password reset failed");
      }
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /* ================================================
     HELPERS
  ================================================ */
  const resetForgotFlow = () => {
    setForgotStep(0);
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setShowNewPassword(false);
  };

  /* ================================================
     UI
  ================================================ */
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold">EquiShare</CardTitle>
              <CardDescription>Sign in to rent or list equipment</CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <Tabs defaultValue="login">
                <TabsList className="grid grid-cols-2 w-full mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup" onClick={resetForgotFlow}>Signup</TabsTrigger>
                </TabsList>

                {/* ==================== LOGIN TAB ==================== */}
                <TabsContent value="login">

                  {/* Forgot password flow replaces login form */}
                  {forgotStep !== 0 ? (
                    <div className="space-y-4">

                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={resetForgotFlow}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowLeft size={18} />
                        </button>
                        <div>
                          <p className="font-semibold text-sm">Reset Password</p>
                          <p className="text-xs text-muted-foreground">
                            {forgotStep === 1 && "Enter your email to receive an OTP"}
                            {forgotStep === 2 && `OTP sent to ${forgotEmail}`}
                            {forgotStep === 3 && "Create your new password"}
                          </p>
                        </div>
                      </div>

                      {/* Step indicators */}
                      <div className="flex items-center gap-1 mb-4">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              forgotStep >= step ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Step 1: Email */}
                      {forgotStep === 1 && (
                        <form onSubmit={sendForgotOtp} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="forgot-email">Email Address</Label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="your@email.com"
                                className="pl-9"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                required
                                autoFocus
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Sending OTP..." : "Send OTP"}
                          </Button>
                        </form>
                      )}

                      {/* Step 2: Verify OTP */}
                      {forgotStep === 2 && (
                        <form onSubmit={verifyForgotOtp} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="forgot-otp">6-digit OTP</Label>
                            <div className="relative">
                              <ShieldCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="forgot-otp"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="Enter OTP"
                                className="pl-9 tracking-widest text-center font-mono text-lg"
                                value={forgotOtp}
                                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                                required
                                autoFocus
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Verifying..." : "Verify OTP"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-sm"
                            disabled={isLoading}
                            onClick={() => setForgotStep(1)}
                          >
                            Resend OTP
                          </Button>
                        </form>
                      )}

                      {/* Step 3: New Password */}
                      {forgotStep === 3 && (
                        <form onSubmit={resetPassword} className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                className="pl-9 pr-10"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                autoFocus
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex={-1}
                              >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                          </div>
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Resetting..." : "Reset Password"}
                          </Button>
                        </form>
                      )}
                    </div>

                  ) : (
                    /* Normal Login Form */
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          required
                          autoComplete="email"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="login-password">Password</Label>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => setForgotStep(1)}
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showLoginPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="pr-10"
                            required
                            autoComplete="current-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            tabIndex={-1}
                          >
                            {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  )}
                </TabsContent>

                {/* ==================== SIGNUP TAB ==================== */}
                <TabsContent value="signup">

                  {/* Step 1: Email + Password */}
                  {signupStep === 1 && (
                    <form onSubmit={handleSignup} className="space-y-4">
                      <div className="space-y-1">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="your@email.com"
                          required
                          autoComplete="email"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showSignupPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            className="pr-10"
                            required
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:bg-transparent"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            tabIndex={-1}
                          >
                            {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating account..." : "Create Account"}
                      </Button>
                    </form>
                  )}

                  {/* Step 2: Verify OTP */}
                  {signupStep === 2 && (
                    <div className="space-y-4">
                      <div className="text-center space-y-1 py-2">
                        <ShieldCheck className="mx-auto text-primary" size={32} />
                        <p className="font-semibold text-sm">Check your email</p>
                        <p className="text-xs text-muted-foreground">
                          We sent a 6-digit OTP to <span className="font-medium text-foreground">{signupEmail}</span>
                        </p>
                      </div>

                      <form onSubmit={handleSignupOtpVerify} className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="signup-otp">Enter OTP</Label>
                          <Input
                            id="signup-otp"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="••••••"
                            className="tracking-widest text-center font-mono text-lg"
                            value={signupOtp}
                            onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ""))}
                            required
                            autoFocus
                          />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Verifying..." : "Verify & Continue"}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full text-sm"
                          onClick={() => {
                            setSignupStep(1);
                            setSignupOtp("");
                          }}
                        >
                          ← Use different email
                        </Button>
                      </form>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
