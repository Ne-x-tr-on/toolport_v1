import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Footer from "@/components/layout/Footer";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError("Invalid credentials. Please try again.");
      } else {
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (err) {
      setError("An error occurred during login. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Wrench className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ToolPort</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mechatronics Department Tool Management
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Admin Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Your username"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </div>
          {/*
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Access Only</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><span className="font-mono font-medium text-foreground">DIM/0245/25</span> / admin123</p>
            </div>
          </div> */}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
