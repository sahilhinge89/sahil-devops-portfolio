import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { DockDemo } from "@/components/dock-demo";
import { About, Contact, Experience, HeroCopy, Projects } from "@/components/portfolio/Sections";
import { ShipItStage } from "@/ship-it/ui/ShipItStage";

const TITLE = "Sahil Hinge — DevOps Engineer";
const DESCRIPTION =
  "Portfolio of Sahil Hinge, DevOps Engineer: Terraform, Docker, GitHub Actions, ArgoCD, Kubernetes and observability, told as a 3D port story.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  const [navVisible, setNavVisible] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const onReveal = useCallback((v: boolean) => setNavVisible(v), []);
  useEffect(() => setCoarse(window.matchMedia("(pointer: coarse)").matches), []);
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <DockDemo visible={navVisible} coarse={coarse} />
      <ShipItStage onReveal={onReveal}>
        <HeroCopy />
      </ShipItStage>
      <main id="main">
        <About />
        <Experience />
        <Projects />
        <Contact />
      </main>
    </>
  );
}
