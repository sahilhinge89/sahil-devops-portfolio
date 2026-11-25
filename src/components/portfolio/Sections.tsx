import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Copy, Download, ExternalLink, Github, Mail, Star } from "lucide-react";
import { DockTitle, copyEmail } from "@/components/dock-demo";
import { Button } from "@/components/ui/button";
import { config } from "@/config";

export function HeroCopy() {
  return (
    <div className="relative max-w-3xl rounded-2xl bg-white/40 p-5 backdrop-blur-[2px] sm:p-8 md:p-10">
      <div aria-hidden className="pointer-events-none absolute -inset-x-10 -inset-y-12 -z-10 rounded-[3rem] bg-gradient-to-t from-background via-background/40 to-transparent [mask-image:radial-gradient(ellipse_at_center,black_55%,transparent_100%)]" />
      <p className="kicker font-bold tracking-widest text-emerald-900 opacity-0 group-data-[revealed=true]:animate-rise">shipped to production</p>
      <h1 className="mt-3 text-emerald-950 drop-shadow-[0_2px_12px_rgba(255,255,255,0.9)] opacity-0 group-data-[revealed=true]:animate-resolve">
        <DockTitle className="bg-none text-emerald-950" />
      </h1>
      <p
        className="mt-3 font-display text-2xl font-extrabold tracking-tight text-emerald-700 drop-shadow-[0_1px_6px_rgba(255,255,255,0.85)] opacity-0 group-data-[revealed=true]:animate-rise sm:text-4xl md:text-5xl"
        style={{ animationDelay: "150ms" }}
      >
        {config.role}
      </p>
      <p
        className="mt-3 max-w-2xl font-display text-lg font-semibold tracking-wide text-teal-800 opacity-0 group-data-[revealed=true]:animate-rise sm:text-xl md:text-2xl"
        style={{ animationDelay: "220ms" }}
      >
        {config.tagline}
      </p>
      <p
        className="mt-4 max-w-xl text-sm font-medium leading-relaxed text-slate-900 opacity-0 group-data-[revealed=true]:animate-rise sm:text-base md:text-lg"
        style={{ animationDelay: "280ms" }}
      >
        {config.pitch}
      </p>
      <div
        className="mt-7 flex flex-wrap gap-3 opacity-0 group-data-[revealed=true]:animate-rise"
        style={{ animationDelay: "400ms" }}
      >
        <Button asChild variant="hero" size="pill">
          <a href="#projects">
            View projects <ArrowDown />
          </a>
        </Button>
        <Button asChild variant="glass" size="pill">
          <a href={config.cvUrl} download>
            <Download /> Download CV
          </a>
        </Button>
      </div>
    </div>
  );
}

function SectionHead({ index, label, title }: { index: string; label: string; title: string }) {
  return (
    <div className="mb-10">
      <p className="kicker">
        {index} — {label}
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">{title}</h2>
    </div>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <li className="rounded-full border border-border bg-accent px-3 py-1 font-mono text-xs text-accent-foreground">{children}</li>
  );
}

function LinkButton({ href, label, icon }: { href: string; label: string; icon: "github" | "live" }) {
  const Icon = icon === "github" ? Github : ExternalLink;
  if (!href)
    return (
      <span aria-disabled="true" className="inline-flex items-center gap-2 rounded-full border border-dashed border-border px-4 py-2 text-sm text-muted-foreground/70">
        <Icon className="size-4" /> {label} — soon
      </span>
    );
  return (
    <Button asChild variant={icon === "github" ? "glass" : "hero"} size="sm">
      <a href={href} target="_blank" rel="noopener noreferrer">
        <Icon /> {label}
      </a>
    </Button>
  );
}

const TERMINAL_COMMANDS = ["whoami", "cat core-stack.txt", "cat learning.txt"] as const;

const INTRO_TEXT =
  "Hi, I'm Sahil — a Full-Stack DevOps Engineer who builds applications end-to-end, automates infrastructure, and turns code into reliable, production-ready software.";

const CORE_TECHNOLOGIES = ["Git", "Bash", "Linux", "AWS", "Docker", "Kubernetes", "Argo CD"] as const;
const CURRENTLY_LEARNING = ["Terraform", "Ansible", "Grafana", "Prometheus"] as const;

interface TermState {
  activeCmd: number;
  charCount: number;
  introChars: number;
  taglineShown: boolean;
  revealed: number;
  phase: "typing-cmd" | "typing-intro" | "post-cmd" | "hold" | "clearing";
}

const INITIAL_TERM_STATE: TermState = {
  activeCmd: 0,
  charCount: 0,
  introChars: 0,
  taglineShown: false,
  revealed: 0,
  phase: "typing-cmd",
};

function TerminalPrompt({
  command,
  cursor = false,
  blink = false,
}: {
  command?: string;
  cursor?: boolean;
  blink?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono">
      <span className="font-bold text-emerald-400">sahil@devops-box:~$</span>
      {command !== undefined && <span className="font-bold text-emerald-400">{command}</span>}
      {cursor && (
        <span
          className={`inline-block h-3.5 w-[2px] rounded-full bg-emerald-400/90 ${
            blink ? "animate-pulse-soft" : ""
          }`}
        />
      )}
    </div>
  );
}

export function About() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [term, setTerm] = useState<TermState>(INITIAL_TERM_STATE);

  useEffect(() => {
    const el = terminalRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setInView(entry.isIntersecting);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    const currentCmd = TERMINAL_COMMANDS[term.activeCmd];
    let delay = 40;

    if (term.phase === "hold") {
      delay = 4500;
    } else if (term.phase === "clearing") {
      delay = 450;
    } else if (term.phase === "typing-intro") {
      delay = term.introChars < INTRO_TEXT.length ? 16 : 220;
    } else if (term.phase === "post-cmd") {
      delay = term.activeCmd === 1 ? 650 : term.activeCmd === 2 ? 480 : 300;
    } else if (currentCmd && term.charCount >= currentCmd.length) {
      delay = 160;
    }

    const timer = window.setTimeout(() => {
      setTerm((prev) => {
        if (prev.phase === "hold") {
          return { ...prev, phase: "clearing" };
        }
        if (prev.phase === "clearing") {
          return INITIAL_TERM_STATE;
        }
        if (prev.phase === "typing-intro") {
          if (prev.introChars < INTRO_TEXT.length) {
            return { ...prev, introChars: Math.min(INTRO_TEXT.length, prev.introChars + 2) };
          }
          if (!prev.taglineShown) {
            return { ...prev, taglineShown: true, phase: "post-cmd" };
          }
          return { ...prev, phase: "post-cmd" };
        }
        if (prev.phase === "post-cmd") {
          const nextCmd = prev.activeCmd + 1;
          if (nextCmd >= TERMINAL_COMMANDS.length) {
            return {
              ...prev,
              activeCmd: TERMINAL_COMMANDS.length,
              charCount: 0,
              revealed: TERMINAL_COMMANDS.length,
              phase: "hold",
            };
          }
          return { ...prev, activeCmd: nextCmd, charCount: 0, phase: "typing-cmd" };
        }
        const cmd = TERMINAL_COMMANDS[prev.activeCmd];
        if (!cmd) return INITIAL_TERM_STATE;
        if (prev.charCount < cmd.length) {
          return { ...prev, charCount: prev.charCount + 1 };
        }
        if (prev.activeCmd === 0) {
          return { ...prev, revealed: 1, phase: "typing-intro" };
        }
        return { ...prev, revealed: prev.activeCmd + 1, phase: "post-cmd" };
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [inView, term]);

  const cmdText = (idx: number) => {
    if (term.activeCmd > idx) return TERMINAL_COMMANDS[idx]!;
    if (term.activeCmd === idx) return TERMINAL_COMMANDS[idx]!.slice(0, term.charCount);
    return "";
  };

  return (
    <section
      id="about"
      aria-labelledby="about-title"
      className="relative flex w-full flex-col items-center justify-center bg-background px-4 py-20 text-foreground sm:px-6 md:py-28"
    >
      {/* Section Header */}
      <div className="mx-auto mb-8 w-full max-w-5xl text-center">
        <p className="kicker">01 — About</p>
        <h2 id="about-title" className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          From Commit to Ship
        </h2>
      </div>

      {/* Screen-reader accessible summary */}
      <div className="sr-only">
        <p>SAHIL HINGE — FULL-STACK DEVOPS ENGINEER</p>
        <p>{INTRO_TEXT}</p>
        <p>Building Applications. Automating Infrastructure. Delivering Reliability.</p>
        <p>Core Technologies: {CORE_TECHNOLOGIES.join(", ")}</p>
        <p>Currently Learning: {CURRENTLY_LEARNING.join(", ")}</p>
      </div>

      {/* Terminal Shell */}
      <div
        ref={terminalRef}
        aria-hidden
        className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl border border-emerald-400/20 bg-[#121316] font-mono text-xs shadow-[0_0_40px_-10px_rgba(16,185,129,0.2),0_24px_60px_rgba(0,0,0,0.65)] sm:text-base"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#18181b] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#ff5f56]/90" />
            <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/90" />
            <span className="h-3 w-3 rounded-full bg-[#27c93f]/90" />
          </div>
          <span className="text-xs font-medium text-zinc-400">sahil@devops-box: ~</span>
          <div className="w-12" />
        </div>

        {/* Terminal Body */}
        <div
          className={`min-h-[380px] space-y-5 break-words p-5 text-zinc-100 transition-opacity duration-500 ease-out sm:min-h-[430px] sm:p-8 ${
            term.phase === "clearing" ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* Command 1: whoami */}
          <div className="space-y-2.5">
            <TerminalPrompt
              command={cmdText(0)}
              cursor={term.activeCmd === 0 && term.phase === "typing-cmd"}
            />
            {term.revealed >= 1 && (
              <div className="animate-rise space-y-2 border-l-2 border-emerald-400/30 pl-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-base font-bold tracking-wide text-zinc-100 sm:text-xl">SAHIL HINGE</span>
                  <span className="text-xs font-semibold tracking-widest text-emerald-300 sm:text-sm">
                    FULL-STACK DEVOPS ENGINEER
                  </span>
                </div>
                <p className="leading-relaxed text-zinc-100/95">
                  {INTRO_TEXT.slice(0, term.introChars)}
                  {term.phase === "typing-intro" && term.introChars < INTRO_TEXT.length && (
                    <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] rounded-full bg-emerald-400/90" />
                  )}
                </p>
                {term.taglineShown && (
                  <p className="animate-rise text-xs font-medium text-emerald-300 sm:text-base">
                    Building Applications. Automating Infrastructure. Delivering Reliability.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Command 2: Core Technologies */}
          {term.activeCmd >= 1 && (
            <div className="space-y-2.5">
              <TerminalPrompt
                command={cmdText(1)}
                cursor={term.activeCmd === 1 && term.phase === "typing-cmd"}
              />
              {term.revealed >= 2 && (
                <div className="animate-rise space-y-2 pl-2">
                  <p className="text-[11px] font-bold tracking-widest text-emerald-300 sm:text-xs">
                    CORE TECHNOLOGIES
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CORE_TECHNOLOGIES.map((tech, idx) => (
                      <span
                        key={tech}
                        style={{ animationDelay: `${idx * 65}ms` }}
                        className="animate-rise rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 sm:text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Command 3: Currently Learning */}
          {term.activeCmd >= 2 && (
            <div className="space-y-2.5">
              <TerminalPrompt
                command={cmdText(2)}
                cursor={term.activeCmd === 2 && term.phase === "typing-cmd"}
              />
              {term.revealed >= 3 && (
                <div className="animate-rise space-y-2 pl-2">
                  <p className="text-[11px] font-bold tracking-widest text-amber-400 sm:text-xs">
                    CURRENTLY LEARNING
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CURRENTLY_LEARNING.map((tech, idx) => (
                      <span
                        key={tech}
                        style={{ animationDelay: `${idx * 75}ms` }}
                        className="animate-rise rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 sm:text-sm"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Active Prompt with Gentle Breathing Cursor */}
          {(term.phase === "hold" || term.phase === "clearing") && (
            <div className="animate-rise pt-1">
              <TerminalPrompt cursor blink />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-32">
      <div id="projects-title">
        <SectionHead index="03" label="Projects" title="Containers I've shipped." />
      </div>
      <ul className="grid gap-5 md:grid-cols-2">
        {config.projects.map((p, i) => (
          <li
            key={p.title}
            className={`flex flex-col rounded-3xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift ${
              p.featured ? "border-primary/50 md:col-span-2 md:p-8" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">node-{i + 1}</span>
              {p.featured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                  <Star className="size-3" /> Featured
                </span>
              ) : (
                <span className="size-2 rounded-full bg-success" aria-hidden />
              )}
            </div>
            <h3 className={`mt-5 font-semibold ${p.featured ? "text-2xl sm:text-3xl" : "text-xl"}`}>{p.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">{p.summary}</p>
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tech stack">
              {p.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={p.githubUrl} label="GitHub Repo" icon="github" />
              <LinkButton href={p.liveUrl} label="Live Demo" icon="live" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="bg-sky/40 py-20 md:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div id="experience-title">
          <SectionHead index="02" label="Experience" title="Voyages so far." />
        </div>
        <ol className="relative ml-2 border-l border-primary/30">
          {config.experience.map((e, i) => (
            <li key={i} className="relative pb-12 pl-6 last:pb-0 sm:pl-8">
              <span className="absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 border-primary bg-background" aria-hidden />
              <h3 className="text-lg font-semibold sm:text-xl">{e.role}</h3>
              <p className="mt-1 break-words font-mono text-xs font-semibold text-primary">
                {e.org} | {e.period}
              </p>
              <ul className="mt-4 list-disc space-y-1.5 pl-4">
                {e.points.map((pt, k) => (
                  <li key={k} className="text-sm leading-relaxed">
                    {pt}
                  </li>
                ))}
              </ul>
              {"techStack" in e && e.techStack.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tech Stack
                  </p>
                  <ul className="flex flex-wrap gap-2" aria-label="Experience tech stack">
                    {e.techStack.map((tech) => (
                      <Badge key={tech}>{tech}</Badge>
                    ))}
                  </ul>
                </div>
              )}
              {e.metrics.length > 0 && (
                <dl className="mt-4 flex flex-wrap gap-4">
                  {e.metrics.map((m) => (
                    <div key={m.label}>
                      <dt className="text-xs text-muted-foreground">{m.label}</dt>
                      <dd className="font-mono font-semibold">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <LinkButton href={e.liveUrl} label="Live site" icon="live" />
                <LinkButton href={e.githubUrl} label="GitHub" icon="github" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-32">
      <div className="rounded-[2rem] bg-sky-gradient p-6 shadow-lift sm:p-14">
        <p className="kicker">04 — Contact</p>
        <h2 id="contact-title" className="mt-3 max-w-xl text-3xl font-semibold sm:text-5xl">
          Got something to ship?
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">Infrastructure, pipelines or a cluster that needs a steady hand.</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {config.email ? (
            <Button asChild variant="hero" size="pill">
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(config.email)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail /> {config.email}
              </a>
            </Button>
          ) : (
            <Button variant="hero" size="pill" disabled aria-label="Email address not set yet">
              <Mail /> Email not set yet
            </Button>
          )}
          <Button variant="glass" size="pill" onClick={copyEmail}>
            <Copy /> Copy email
          </Button>
          <Button asChild variant="glass" size="pill">
            <a href={config.githubUrl} target="_blank" rel="noopener noreferrer">
              <Github /> GitHub <ArrowUpRight />
            </a>
          </Button>
          {config.linkedinUrl && (
            <Button asChild variant="glass" size="pill">
              <a href={config.linkedinUrl} target="_blank" rel="noopener noreferrer">
                LinkedIn <ArrowUpRight />
              </a>
            </Button>
          )}
        </div>
      </div>
      <footer className="mt-16 mb-20 flex flex-col items-start justify-between gap-2 font-mono text-xs text-muted-foreground sm:flex-row">
        <span>
          {config.name} · {config.role}
        </span>
        <span>status: running 3/3</span>
      </footer>
    </section>
  );
}
