import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-md mx-auto py-24 flex items-center justify-center">
        <Card className="w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">Email Verification</CardTitle>
            <CardDescription>
              {status === "loading" && "Verifying your email address..."}
              {status === "success" && "Verification Successful!"}
              {status === "error" && "Verification Failed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {status === "loading" && (
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            )}
            
            {status === "success" && (
              <>
                <CheckCircle2 className="w-20 h-20 text-green-500" />
                <p className="text-muted-foreground">
                  Your email has been successfully verified. You can now log into your account.
                </p>
                <Button asChild className="w-full">
                  <Link to="/auth">Go to Login</Link>
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-20 h-20 text-destructive" />
                <p className="text-muted-foreground">
                  The verification link is invalid or has expired. Please try signing up again or contact support.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Back to Authentication</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
