// ─────────────────────────────────────────────────────────────────────────────
// All editable portfolio content lives here. Anything in [square brackets] is a
// detail to fill in. Leave a URL as "" and its icon
// or link renders muted and inert instead of pointing somewhere made-up.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  name: "SAHIL HINGE",
  role: "DevOps Engineer",

  tagline: "From Localhost to Live",
  pitch: "I take code from commit to production — CI/CD pipelines, containers and Kubernetes, watched end to end.",

  email: "sahilhinge.work@gmail.com",
  githubUrl: "https://github.com/sahilhinge89",
  linkedinUrl: "https://www.linkedin.com/in/sahil-hinge45/",

  // "Download CV" button. Put your PDF at public/Sahil_Hinge_CV.pdf (or change this path).
  cvUrl: "/Sahil_Hinge_CV.pdf",

  // About section terminal: each command is typed, then its output lines print.
  terminal: {
    username: "sahil",
    hostname: "devops-box",
    commands: [
      {
        input: "whoami",
        output: [
          "sahil hinge",
          "Role: DevOps & Cloud Infrastructure Engineer",
          "Focus: CI/CD Pipelines, Container Orchestration, Cloud Architecture",
        ],
      },
      {
        input: "cat about.txt",
        output: [
          "From Localhost to Live.",
          "Passionate about deploying and automating resilient systems.",
          "Experienced in containerizing workloads, managing Kubernetes clusters,",
          "and provisioning automated GitOps pipelines with zero-downtime releases.",
        ],
      },
      {
        input: "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'",
        output: [
          "NAMES             STATUS          PORTS",
          "studykaro-prod    Up 21 days      0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp",
          "eyeview-engine    Up 21 days      0.0.0.0:5000->5000/tcp",
          "nginx-ingress     Up 21 days      0.0.0.0:8080->8080/tcp",
        ],
      },
      {
        input: "kubectl get nodes",
        output: [
          "NAME              STATUS   ROLES           AGE   VERSION",
          "k8s-control-01    Ready    control-plane   60d   v1.30.2",
          "k8s-worker-01     Ready    worker          60d   v1.30.2",
          "k8s-worker-02     Ready    worker          60d   v1.30.2",
        ],
      },
      {
        input: "cat ~/status.log",
        output: ["[OK] All services healthy.", "[READY] Ready to deploy production-grade cloud workloads."],
      },
    ],
    typingWords: [
      "From Localhost to Live 🚀",
      "Automating CI/CD Pipelines ⚙️",
      "Kubernetes & Container Orchestration 🐳",
      "Zero-Downtime Cloud Deployments ☁️",
    ],
  },

  skillGroups: [
    { title: "Infrastructure & Cloud", items: ["AWS", "Linux"] },
    { title: "Containers & Orchestration", items: ["Docker", "Kubernetes"] },
    { title: "CI/CD & Version Control", items: ["Git", "GitHub", "ArgoCD"] },
  ],

  // Fill liveUrl / githubUrl ("" renders the button muted). repo: name under githubUrl.
  projects: [
    {
      title: "StudyKaro",
      featured: true,
      summary:
        "Full-stack ed-tech platform with containerized frontend and backend services behind an Nginx reverse proxy, orchestrated via Kubernetes Deployments and Services.",
      tags: ["Docker", "Kubernetes", "Nginx", "React", "Node.js", "MongoDB"],
      githubUrl: "https://github.com/sahilhinge89/StudyKaro",
      liveUrl: "",
    },
    {
      title: "EyeView v2",
      featured: false,
      summary:
        "AI-powered real-time violence detection and alert system pairing a Python/Flask inference backend with a React monitoring frontend for public safety.",
      tags: ["Python", "Flask", "React", "AI/ML", "Computer Vision"],
      githubUrl: "https://github.com/sahilhinge89/EyeView_v2",
      liveUrl: "",
    },
    {
      title: "FileUploadSystem",
      featured: false,
      summary:
        "Containerized full-stack media upload service built with React, Node.js, and Express, storing files in Amazon S3 (AWS SDK v3) and metadata in MongoDB.",
      tags: ["Docker", "AWS S3", "React", "Node.js", "Express", "MongoDB"],
      githubUrl: "https://github.com/sahilhinge89/FileUploadSystem",
      liveUrl: "",
    },
    {
      title: "Netflix Clone",
      featured: false,
      summary:
        "Responsive Netflix-inspired streaming web interface with interactive content rows, category browsing, and media preview layout.",
      tags: ["React", "JavaScript", "CSS", "HTML", "Git"],
      githubUrl: "https://github.com/sahilhinge89/Netflix",
      liveUrl: "",
    },
  ],

  experience: [
    {
      role: "Freelance Full-Stack DevOps Engineer",
      org: "DoesntMatterPrivateLimited",
      period: "Freelance Project",
      project: "StudyKaro",
      points: [
        "Contributed to StudyKaro, a full-stack application, working on application deployment and infrastructure.",
        "Containerized frontend and backend services using Docker.",
        "Configured Kubernetes Deployments, Services, ConfigMaps, Secrets, and Namespaces.",
        "Worked on Jenkins CI/CD pipelines to automate build and deployment workflows.",
        "Updated vulnerable dependencies and improved application security and maintainability.",
        "Troubleshot deployment, container, and database compatibility issues.",
        "Collaborated with developers through Git, GitHub, and code reviews.",
      ],
      techStack: [
        "Docker",
        "Kubernetes",
        "Jenkins",
        "Linux",
        "Git",
        "GitHub",
        "Bash",
        "YAML",
        "MongoDB",
        "React",
        "Express",
        "Nodejs",
      ],
      liveUrl: "", // production URL
      githubUrl: "https://github.com/sahilhinge89/StudyKaro",
      metrics: [] as { label: string; value: string }[],
    },
  ],

  // Opening globe: cities, routes and the port the camera dives into ("nyc").
  globe: {
    focusId: "nyc",
    markers: [
      { id: "sf", location: [37.7595, -122.4367], label: "San Francisco" },
      { id: "nyc", location: [40.7128, -74.006], label: "New York" },
      { id: "tokyo", location: [35.6762, 139.6503], label: "Tokyo" },
      { id: "london", location: [51.5074, -0.1278], label: "London" },
      { id: "sydney", location: [-33.8688, 151.2093], label: "Sydney" },
      { id: "capetown", location: [-33.9249, 18.4241], label: "Cape Town" },
      { id: "dubai", location: [25.2048, 55.2708], label: "Dubai" },
      { id: "paris", location: [48.8566, 2.3522], label: "Paris" },
      { id: "saopaulo", location: [-23.5505, -46.6333], label: "São Paulo" },
    ],
    arcs: [
      { id: "sf-tokyo", from: [37.7595, -122.4367], to: [35.6762, 139.6503], label: "SF → Tokyo" },
      { id: "nyc-london", from: [40.7128, -74.006], to: [51.5074, -0.1278], label: "NYC → London" },
    ],
  },

  // Captions for the opening animation (keep them short).
  captions: {
    globe: "New York · Port",
    terraform: "terraform apply · infra ready",
    docker: "docker build -t myapp:1.0",
    actions: "GitHub Actions: lint · test · scan → push",
    argocd: "ArgoCD sync · kube-scheduler: pod → node",
    rollout: "kubectl rollout status",
    running: "Running 3/3",
    monitoring: "Prometheus · Grafana: watching",
    shipped: "Shipped to production.",
  },
} as const;

export type SiteConfig = typeof config;
