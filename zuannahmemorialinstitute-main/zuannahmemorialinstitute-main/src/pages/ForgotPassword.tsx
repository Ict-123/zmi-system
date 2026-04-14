import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSent(true);
      toast({
        title: "Email sent",
        description: "Check your inbox for the password reset link.",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brown p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="mx-auto bg-brown rounded-full p-4 w-fit">
            <GraduationCap className="w-10 h-10 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Reset Password
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email to receive a reset link
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and follow the instructions.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                <Mail className="w-4 h-4 mr-2" />
                {submitting ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link to="/login" className="block">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
