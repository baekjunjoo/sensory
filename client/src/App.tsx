import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import GooglyEyesTracker from "./components/GooglyEyesTracker";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const Report = lazy(() => import("./pages/Report"));

function ReportRoute() {
  return <Suspense fallback={<main className="report-page report-loading" aria-busy="true" aria-live="polite"><div><span>WEEKLY LEARNING REPORT</span><b>보호자 리포트를 불러오고 있어요.</b></div></main>}><Report /></Suspense>;
}

const isGitHubPagesBuild = import.meta.env.VITE_GITHUB_PAGES === "true";

function Router() {
  if (isGitHubPagesBuild) {
    return new URLSearchParams(window.location.search).get("view") === "report" ? <ReportRoute /> : <Home />;
  }
  return <Switch>
    <Route path={"/"} component={Home} />
    <Route path={"/report"} component={ReportRoute} />
    <Route path={"/404"} component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function GitHubPagesLinkAdapter() {
  useEffect(() => {
    if (!isGitHubPagesBuild) return;
    const base = import.meta.env.BASE_URL;
    const handleClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href^="/"]');
      if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute("href");
      if (href === "/report") { event.preventDefault(); window.location.assign(`${base}?view=report`); }
      if (href === "/") { event.preventDefault(); window.location.assign(base); }
      if (href === "/#today" || href === "/#studio") { event.preventDefault(); window.location.assign(`${base}${href.slice(1)}`); }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);
  return null;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><GitHubPagesLinkAdapter /><GooglyEyesTracker /><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
