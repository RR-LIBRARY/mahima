import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/supabaseHelpers";

// Components
import Hero, { HeroData, HeroStat } from "@/components/Landing/Hero";
import Features from "@/components/Landing/Features";
import LeadForm from "@/components/Landing/LeadForm";
import Footer from "@/components/Landing/Footer";
import { Button } from "@/components/ui/button";
import { HeroSkeleton } from "@/components/ui/page-skeleton";
import logo from "@/assets/mahima-logo.png";

// Content fetch timeout
const CONTENT_TIMEOUT = 5000;

// Memoized Navigation component with mobile-friendly touch targets
const Navigation = memo(({ isAuthenticated }: { isAuthenticated: boolean }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <img 
          src={logo} 
          alt="Mahima Academy" 
          className="h-10 w-10 rounded-xl"
          loading="eager"
        />
        <span className="font-bold text-xl text-foreground hidden sm:inline">
          Mahima Academy
        </span>
      </Link>
      <div className="flex items-center gap-2 flex-wrap">
        <Link to="/courses">
          <Button variant="ghost" className="h-11 text-foreground hover:bg-muted transition-colors duration-200">
            Courses
          </Button>
        </Link>
        <Link to="/books">
          <Button variant="ghost" className="h-11 text-foreground hover:bg-muted transition-colors duration-200 hidden sm:inline-flex">
            Books
          </Button>
        </Link>
        {isAuthenticated ? (
          <Link to="/dashboard">
            <Button className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
              Dashboard
            </Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost" className="h-11 text-foreground hover:bg-muted transition-colors duration-200">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                Sign Up
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  </nav>
));

Navigation.displayName = "Navigation";

const Index = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [stats, setStats] = useState<HeroStat[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Fetch hero content + site stats in parallel
  const fetchContent = useCallback(async () => {
    try {
      const [heroResult, statsResult] = await Promise.all([
        withTimeout(
          Promise.resolve(
            supabase
              .from('landing_content')
              .select('section_key, content')
              .eq('section_key', 'hero')
              .single()
          ),
          CONTENT_TIMEOUT
        ),
        withTimeout(
          Promise.resolve(
            supabase
              .from('site_stats')
              .select('stat_key, stat_value')
          ),
          CONTENT_TIMEOUT
        ),
      ]);

      if (heroResult.data?.content) {
        setHeroData(heroResult.data.content as unknown as HeroData);
      }

      if (statsResult.data) {
        setStats(statsResult.data as HeroStat[]);
      }
    } catch (error) {
      console.error("Content fetch error:", error);
      setHasTimedOut(true);
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const authState = useMemo(() => isAuthenticated, [isAuthenticated]);

  if (contentLoading && !hasTimedOut) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation isAuthenticated={false} />
        <main className="pt-20">
          <HeroSkeleton />
          <div className="py-16 px-4">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation isAuthenticated={authState} />
      
      <main className="pt-20">
        <Hero data={heroData} stats={stats} />
        <Features />
        <LeadForm />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
