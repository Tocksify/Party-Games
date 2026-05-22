import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { ChevronLeft } from "lucide-react";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logoutMutation = useLogout();

  const onLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      }
    });
  };

  return (
    <PageTransition className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto flex flex-col relative z-10">
      <header className="flex items-center justify-between mb-12">
        <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-back">
          <ChevronLeft className="w-6 h-6" />
        </SoundButton>
        <h1 className="text-2xl font-bold font-mono tracking-widest text-primary">SETTINGS</h1>
      </header>

      <div className="flex-1">
        <div className="p-8 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm space-y-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-4 text-foreground/80">Account Status</h2>
            {!isAuthenticated ? (
              <div className="space-y-4">
                <p className="text-muted-foreground font-mono text-sm">Not connected to identity server.</p>
                <SoundButton onClick={() => setLocation("/auth")} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-auth-redirect">
                  Authenticate
                </SoundButton>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm font-mono bg-black/50 p-4 rounded-lg border border-white/5">
                  <div className="text-muted-foreground">ID</div>
                  <div className="text-right">{user?.id}</div>
                  <div className="text-muted-foreground">Alias</div>
                  <div className="text-right">{user?.username}</div>
                  <div className="text-muted-foreground">Type</div>
                  <div className="text-right text-primary">{user?.isGuest ? "GUEST" : "REGISTERED"}</div>
                </div>
                
                <SoundButton variant="destructive" onClick={onLogout} disabled={logoutMutation.isPending} data-testid="button-logout">
                  {logoutMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </SoundButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
