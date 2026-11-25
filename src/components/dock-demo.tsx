// Site navigation dock (adapted from the MagicUI dock demo): Home / About / Projects,
// then GitHub, LinkedIn, X and Email from src/config.ts. Empty URLs render muted and inert.
import React from "react";
import { Briefcase, Copy, FolderGit2, HomeIcon, MailIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { config } from "@/config";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dock, DockIcon } from "@/components/magicui/dock";

export type IconProps = React.HTMLAttributes<SVGElement>;

const Icons = {
  email: (props: IconProps) => <MailIcon {...props} />,
  linkedin: (props: IconProps) => (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <title>LinkedIn</title>
      <path
        fill="currentColor"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  ),
  github: (props: IconProps) => (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <title>GitHub</title>
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  ),
};

const DATA = {
  navbar: [
    { href: "#top", icon: HomeIcon, label: "Home" },
    { href: "#about", icon: UserIcon, label: "About" },
    { href: "#experience", icon: Briefcase, label: "Experience" },
    { href: "#projects", icon: FolderGit2, label: "Projects" },
  ],
  contact: {
    social: {
      GitHub: { name: "GitHub", url: config.githubUrl, icon: Icons.github, external: true },
      LinkedIn: { name: "LinkedIn", url: config.linkedinUrl, icon: Icons.linkedin, external: true },
      email: {
        name: "Email",
        url: config.email ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(config.email)}` : "",
        icon: Icons.email,
        external: true,
      },
    },
  },
};

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(config.email);
    toast.success("Email copied", { description: config.email });
  } catch {
    toast.error("Couldn't copy — email is " + config.email);
  }
}

const iconLink = cn(
  buttonVariants({ variant: "ghost", size: "icon" }),
  "size-full rounded-full text-nav-foreground/90 hover:bg-nav-hover hover:text-nav-foreground focus-visible:bg-nav-hover",
);

/** Big soft-gradient name used in the hero (the demo's large text above the dock). */
export function DockTitle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none block bg-linear-to-b from-foreground to-muted-foreground/40 bg-clip-text font-display text-[clamp(2.5rem,11vw,7.5rem)] font-semibold leading-none tracking-tight whitespace-pre-wrap text-transparent",
        className,
      )}
    >
      {config.name}
    </span>
  );
}

export function DockDemo({ visible, coarse = false }: { visible: boolean; coarse?: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 z-50 flex justify-center px-2 transition-all duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0",
      )}
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      inert={!visible}
    >
      <nav aria-label="Main" className="max-w-full">
        <TooltipProvider delayDuration={150}>
          <Dock
            direction="middle"
            iconSize={coarse ? 34 : 40}
            iconMagnification={coarse ? 34 : 56}
            disableMagnification={coarse}
            className="mt-0 h-[52px] max-w-[calc(100vw-1rem)] gap-0.5 sm:h-[54px] sm:gap-2"
          >
            {DATA.navbar.map((item) => (
              <DockIcon key={item.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a href={item.href} aria-label={item.label} className={iconLink}>
                      <item.icon className="size-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            ))}
            <Separator orientation="vertical" className="h-full bg-nav-border" />
            {Object.entries(DATA.contact.social).map(([key, social]) => (
              <DockIcon key={key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {social.url ? (
                      <a
                        href={social.url}
                        aria-label={social.name}
                        className={iconLink}
                        {...(social.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        <social.icon className="size-4" />
                      </a>
                    ) : (
                      <span
                        role="link"
                        aria-disabled="true"
                        tabIndex={0}
                        aria-label={`${social.name} (not set yet)`}
                        className={cn(iconLink, "cursor-not-allowed text-muted-foreground/45 hover:bg-transparent hover:text-muted-foreground/45")}
                      >
                        <social.icon className="size-4" />
                      </span>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{social.url ? social.name : `${social.name} — not set yet`}</p>
                  </TooltipContent>
                </Tooltip>
              </DockIcon>
            ))}
            <DockIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" onClick={copyEmail} aria-label="Copy email address" className={iconLink}>
                    <Copy className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy email</p>
                </TooltipContent>
              </Tooltip>
            </DockIcon>
          </Dock>
        </TooltipProvider>
      </nav>
    </div>
  );
}
