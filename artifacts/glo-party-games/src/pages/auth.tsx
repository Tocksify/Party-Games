import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useRegister, useLoginAsGuest, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const guestMutation = useLoginAsGuest();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [guestUsername, setGuestUsername] = useState("");

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    setLocation("/");
  };

  const onLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email: loginEmail, password: loginPassword } },
      { onSuccess, onError: (err) => toast({ variant: "destructive", title: "Login failed", description: err.error }) }
    );
  };

  const onRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: { username: regUsername, email: regEmail, password: regPassword } },
      { onSuccess, onError: (err) => toast({ variant: "destructive", title: "Registration failed", description: err.error }) }
    );
  };

  const onGuest = (e: React.FormEvent) => {
    e.preventDefault();
    guestMutation.mutate(
      { data: { username: guestUsername } },
      { onSuccess, onError: (err) => toast({ variant: "destructive", title: "Guest login failed", description: err.error }) }
    );
  };

  return (
    <PageTransition className="min-h-screen p-6 md:p-12 flex flex-col relative z-10">
      <header className="mb-12">
        <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
          <ChevronLeft className="w-6 h-6" />
        </SoundButton>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* LOGIN */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-primary tracking-tight">LOGIN</h2>
            <form onSubmit={onLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required data-testid="input-login-email" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required data-testid="input-login-password" />
              </div>
              <SoundButton type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={loginMutation.isPending} data-testid="button-login">
                {loginMutation.isPending ? "Connecting..." : "Connect"}
              </SoundButton>
            </form>
          </motion.div>

          {/* REGISTER */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-secondary tracking-tight">REGISTER</h2>
            <form onSubmit={onRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required data-testid="input-register-username" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required data-testid="input-register-email" />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required data-testid="input-register-password" />
              </div>
              <SoundButton type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={registerMutation.isPending} data-testid="button-register">
                {registerMutation.isPending ? "Initializing..." : "Initialize"}
              </SoundButton>
            </form>
          </motion.div>

          {/* GUEST */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-muted-foreground tracking-tight">GUEST</h2>
            <form onSubmit={onGuest} className="space-y-4">
              <div className="space-y-2">
                <Label>Alias</Label>
                <Input value={guestUsername} onChange={(e) => setGuestUsername(e.target.value)} required data-testid="input-guest-username" />
              </div>
              <SoundButton type="submit" variant="outline" className="w-full border-white/10 hover:border-white/20" disabled={guestMutation.isPending} data-testid="button-guest">
                {guestMutation.isPending ? "Bypassing..." : "Bypass"}
              </SoundButton>
            </form>
          </motion.div>

        </div>
      </div>
    </PageTransition>
  );
}
