// ── Content ──────────────────────────────────────────────────────────────────

export interface ContentItem {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  body: string;
}

export const mockContent: ContentItem[] = [
  {
    id: "content-1",
    title: "Getting Started with React Server Components",
    preview:
      "An introduction to the new paradigm of server-side rendering in React...",
    updatedAt: "2026-04-01",
    body: "<p>React Server Components represent a fundamental shift in how we think about rendering...</p>",
  },
  {
    id: "content-2",
    title: "Understanding TypeScript Generics",
    preview:
      "A deep dive into one of TypeScript's most powerful features for reusable code...",
    updatedAt: "2026-03-28",
    body: "<p>Generics allow you to write flexible, reusable functions and classes...</p>",
  },
  {
    id: "content-3",
    title: "CSS Container Queries: A Practical Guide",
    preview:
      "Learn how container queries change the way we approach responsive design...",
    updatedAt: "2026-03-20",
    body: "<p>Container queries let you style elements based on the size of their container...</p>",
  },
  {
    id: "content-4",
    title: "Building Accessible Forms",
    preview:
      "Best practices for creating forms that work for everyone, including assistive technologies...",
    updatedAt: "2026-03-15",
    body: "<p>Accessible forms start with proper labeling and semantic HTML...</p>",
  },
];

// ── Diagrams ─────────────────────────────────────────────────────────────────

export interface DiagramItem {
  id: string;
  title: string;
  updatedAt: string;
}

export const mockDiagrams: DiagramItem[] = [
  {
    id: "diagram-1",
    title: "System Architecture Overview",
    updatedAt: "2026-03-30",
  },
  { id: "diagram-2", title: "Database Schema", updatedAt: "2026-03-22" },
  { id: "diagram-3", title: "Auth Flow", updatedAt: "2026-03-10" },
];

// ── Library (images only) ───────────────────────────────────────────────────

export interface LibraryImage {
  id: string;
  name: string;
  size: string;
  updatedAt: string;
}

export const mockLibraryImages: LibraryImage[] = [
  {
    id: "file-1",
    name: "hero-banner.png",
    size: "1.2 MB",
    updatedAt: "2026-04-01",
  },
  {
    id: "file-2",
    name: "profile-photo.jpg",
    size: "340 KB",
    updatedAt: "2026-03-29",
  },
  {
    id: "file-3",
    name: "architecture-diagram.svg",
    size: "28 KB",
    updatedAt: "2026-03-25",
  },
  {
    id: "file-7",
    name: "og-image.png",
    size: "890 KB",
    updatedAt: "2026-03-12",
  },
  {
    id: "file-8",
    name: "code-screenshot.png",
    size: "450 KB",
    updatedAt: "2026-03-10",
  },
];

// ── Blogs ────────────────────────────────────────────────────────────────────

export type BlogBlockType = "content" | "diagram" | "image";

export interface BlogBlock {
  id: string;
  type: BlogBlockType;
  refId: string;
  refTitle: string;
}

export interface BlogItem {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  blocks: BlogBlock[];
}

export const mockBlogs: BlogItem[] = [
  {
    id: "blog-1",
    title: "Building a Modern Portfolio",
    summary:
      "A walkthrough of how I built my portfolio site using Next.js and Tailwind.",
    updatedAt: "2026-04-02",
    blocks: [
      {
        id: "block-1",
        type: "content",
        refId: "content-1",
        refTitle: "Getting Started with React Server Components",
      },
      {
        id: "block-2",
        type: "diagram",
        refId: "diagram-1",
        refTitle: "System Architecture Overview",
      },
      {
        id: "block-3",
        type: "image",
        refId: "file-1",
        refTitle: "hero-banner.png",
      },
    ],
  },
  {
    id: "blog-2",
    title: "TypeScript Tips for Large Codebases",
    summary:
      "Lessons learned from maintaining TypeScript in production applications.",
    updatedAt: "2026-03-30",
    blocks: [
      {
        id: "block-4",
        type: "content",
        refId: "content-2",
        refTitle: "Understanding TypeScript Generics",
      },
      {
        id: "block-5",
        type: "image",
        refId: "file-8",
        refTitle: "code-screenshot.png",
      },
    ],
  },
  {
    id: "blog-3",
    title: "The State of CSS in 2026",
    summary:
      "Exploring new CSS features and how they change front-end development.",
    updatedAt: "2026-03-22",
    blocks: [
      {
        id: "block-6",
        type: "content",
        refId: "content-3",
        refTitle: "CSS Container Queries: A Practical Guide",
      },
    ],
  },
];
