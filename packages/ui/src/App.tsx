import { SynthesisForm } from "./components/synthesis-form";
import ApiUrl, { ApiUrlProvider } from "./components/api-url";
import { ThemeProvider } from "./components/theme-provider";
import SiteHeader from "./components/site-header";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ApiUrlProvider>
        <SiteHeader />
        <div className="flex flex-col gap-4 w-full mx-8 items-start justify-center">
          <ApiUrl />
          <SynthesisForm />
        </div>
        <Toaster />
      </ApiUrlProvider>
    </ThemeProvider>
  );
}

export default App;
