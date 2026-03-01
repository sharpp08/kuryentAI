import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center">
      <Card className="w-full max-w-md glass-panel mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">404</h1>
            <p className="text-lg text-muted-foreground mb-6">Oops! We couldn't find that page.</p>
            <Link 
              href="/"
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity neon-glow"
            >
              Return to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
