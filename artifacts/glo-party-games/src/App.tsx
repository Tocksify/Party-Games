import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Games from "@/pages/games";
import Auth from "@/pages/auth";
import Settings from "@/pages/settings";
import RoomLobby from "@/pages/room-lobby";
import RoomView from "@/pages/room-view";
import ChessLobby from "@/pages/chess-lobby";
import ChessGame from "@/pages/chess-game";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games" component={Games} />
      <Route path="/auth" component={Auth} />
      <Route path="/settings" component={Settings} />
      <Route path="/rooms/:game" component={RoomLobby} />
      <Route path="/rooms/:game/:code" component={RoomView} />
      <Route path="/chess" component={ChessLobby} />
      <Route path="/chess/:id" component={ChessGame} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
