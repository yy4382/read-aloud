import { ModeToggle } from "./theme-switch";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border mb-8">
      <div className="flex h-14 items-center px-4 justify-between">
        <h1 className="md:text-2xl font-bold">Read Aloud 导入器</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <a href="https://github.com/yy4382/read-aloud">
              Star me on <Github />
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
