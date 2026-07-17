import "dotenv/config";
import { randomUUID } from "node:crypto";
import {
  seedDemoAddCollection,
  seedDemoAddCollectionField,
  seedDemoClearCollections,
  seedDemoClearFileMetadata,
  seedDemoCountCollections,
  seedDemoInsertCollectionItem,
  seedDemoListCollectionFields,
} from "@packages/cms-db/seed-demo";
import type { CollectionFieldType } from "@packages/cms-db/schema";
import {
  seedDemoCreateGradientPng,
  seedDemoUploadGradientImage,
} from "./seed-demo-utils.js";
import { ensureBucket } from "@packages/storage/lib";

const GRADIENT_PAIRS: [string, string][] = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#ff9a9e", "#fecfef"],
  ["#ffecd2", "#fcb69f"],
  ["#a1c4fd", "#c2e9fb"],
  ["#d4fc79", "#96e6a1"],
  ["#84fab0", "#8fd3f4"],
  ["#cfd9df", "#e2ebf0"],
  ["#e0c3fc", "#8ec5fc"],
  ["#f77062", "#fe5196"],
  ["#30cfd0", "#330867"],
  ["#5ee7df", "#b490ca"],
  ["#fdfbfb", "#ebedee"],
  ["#ff758c", "#ff7eb3"],
  ["#c471f5", "#fa71cd"],
  ["#48c6ef", "#6f86d6"],
];

type FieldDef = {
  key: string;
  label: string;
  fieldType: CollectionFieldType;
  required?: boolean;
  isTitle?: boolean;
  /** Resolved to relatedCollectionId during seed (relation fields only). */
  relatedCollectionSlug?: string;
};

type CollectionDef = {
  slug: string;
  title: string;
  description: string;
  fields: FieldDef[];
  items: Record<string, unknown>[];
};

const minimalRichtext = (text: string) => ({
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text }],
    },
  ],
});

const minimalDiagram = () => ({
  version: 1,
  viewport: { x: 0, y: 0, zoom: 1 },
  elements: [] as unknown[],
});

const BLOG_CONTENT_TITLES: { title: string; body: string }[] = [
  { title: "Introduction", body: "A short intro to the project." },
  { title: "Motivation", body: "Why this problem is worth solving." },
  { title: "Goals", body: "What success looks like for v1." },
  { title: "Architecture", body: "High-level system layout." },
  { title: "Data model", body: "Core entities and relationships." },
  { title: "API design", body: "Public endpoints and auth." },
  { title: "Frontend", body: "UI stack and rendering approach." },
  { title: "Deployment", body: "How the app ships to production." },
  { title: "Observability", body: "Logs, metrics, and alerts." },
  { title: "Trade-offs", body: "Decisions we made and why." },
  { title: "Lessons learned", body: "What we would do differently." },
  { title: "Next steps", body: "Planned follow-up work." },
];

const BLOG_DIAGRAM_ITEMS: Record<string, unknown>[] = [
  { title: "System overview", document: minimalDiagram() },
  { title: "Request flow", document: minimalDiagram() },
  { title: "Auth sequence", document: minimalDiagram() },
  { title: "Data pipeline", document: minimalDiagram() },
  { title: "Cache layers", document: minimalDiagram() },
  { title: "Deploy topology", document: minimalDiagram() },
  { title: "Component map", document: minimalDiagram() },
  { title: "State machine", document: minimalDiagram() },
  { title: "Event bus", document: minimalDiagram() },
  { title: "Storage layout", document: minimalDiagram() },
  { title: "Network zones", document: minimalDiagram() },
  { title: "Failure modes", document: minimalDiagram() },
];

const COLLECTIONS: CollectionDef[] = [
  {
    slug: "team-members",
    title: "Team Members",
    description: "People behind the product.",
    fields: [
      {
        key: "name",
        label: "Name",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "role", label: "Role", fieldType: "text" },
      { key: "bio", label: "Bio", fieldType: "long-text" },
    ],
    items: [
      {
        name: "Ada Lovelace",
        role: "Editor",
        bio: "Writes the long-form pieces.",
      },
      {
        name: "Grace Hopper",
        role: "Engineer",
        bio: "Keeps the CMS shipping.",
      },
      {
        name: "Alan Turing",
        role: "Researcher",
        bio: "Explores adjacent ideas.",
      },
    ],
  },
  {
    slug: "blog-content",
    title: "Blog content",
    description: "TipTap content blocks for portfolio blog posts.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "body", label: "Body", fieldType: "richtext", required: true },
      {
        key: "author",
        label: "Author",
        fieldType: "relation",
        relatedCollectionSlug: "team-members",
      },
    ],
    // Populated in seedDemoCollections once team-member item ids exist.
    items: [],
  },
  {
    slug: "blog-diagrams",
    title: "Blog diagrams",
    description: "ScribbleSVG diagram blocks for portfolio blog posts.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "document", label: "Document", fieldType: "diagrams", required: true },
    ],
    items: BLOG_DIAGRAM_ITEMS,
  },
  {
    slug: "testimonials",
    title: "Testimonials",
    description: "Quotes from happy users.",
    fields: [
      {
        key: "author",
        label: "Author",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "quote", label: "Quote", fieldType: "long-text", required: true },
    ],
    items: [],
  },
  {
    slug: "faq",
    title: "FAQ",
    description: "Common questions and answers.",
    fields: [
      {
        key: "question",
        label: "Question",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "answer", label: "Answer", fieldType: "long-text", required: true },
    ],
    items: [],
  },
  {
    slug: "projects",
    title: "Projects",
    description: "Portfolio and case work.",
    fields: [
      {
        key: "name",
        label: "Name",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "description", label: "Description", fieldType: "long-text" },
    ],
    items: [],
  },
  {
    slug: "guides",
    title: "Guides",
    description: "How-to content for editors.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "summary", label: "Summary", fieldType: "long-text" },
    ],
    items: [],
  },
  {
    slug: "announcements",
    title: "Announcements",
    description: "Product and company news.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "body", label: "Body", fieldType: "long-text" },
    ],
    items: [],
  },
  {
    slug: "products",
    title: "Products",
    description: "Catalog items for the storefront.",
    fields: [
      {
        key: "name",
        label: "Name",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "description", label: "Description", fieldType: "long-text" },
      { key: "price", label: "Price", fieldType: "number" },
    ],
    items: [],
  },
  {
    slug: "events",
    title: "Events",
    description: "Upcoming talks and meetups.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "date", label: "Date", fieldType: "date" },
      { key: "details", label: "Details", fieldType: "long-text" },
    ],
    items: [],
  },
  {
    slug: "partners",
    title: "Partners",
    description: "Logos and blurbs for integration partners.",
    fields: [
      {
        key: "name",
        label: "Name",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "description", label: "Description", fieldType: "long-text" },
    ],
    items: [],
  },
  {
    slug: "features",
    title: "Features",
    description: "Marketing feature bullets.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "description", label: "Description", fieldType: "long-text" },
    ],
    items: [],
  },
  {
    slug: "case-studies",
    title: "Case Studies",
    description: "Longer customer stories.",
    fields: [
      {
        key: "title",
        label: "Title",
        fieldType: "text",
        required: true,
        isTitle: true,
      },
      { key: "summary", label: "Summary", fieldType: "long-text" },
    ],
    items: [],
  },
];

const seedDemoImages = async (): Promise<number[]> => {
  const ids: number[] = [];
  const sizes = [
    [960, 540],
    [800, 600],
    [640, 480],
    [1200, 630],
  ] as const;

  for (let i = 0; i < GRADIENT_PAIRS.length; i++) {
    const [from, to] = GRADIENT_PAIRS[i]!;
    const [width, height] = sizes[i % sizes.length]!;
    const buffer = await seedDemoCreateGradientPng(width, height, from, to);
    const filename = `gradient-${String(i + 1).padStart(2, "0")}.png`;
    const objectKey = `${randomUUID()}-${filename}`;

    const id = await seedDemoUploadGradientImage({ objectKey, filename, buffer });
    ids.push(id);
    console.log(`  image ${i + 1}/${GRADIENT_PAIRS.length} (id ${id})`);
  }

  return ids;
};

const seedDemoCollections = async () => {
  let itemCount = 0;
  const collectionIdsBySlug = new Map<string, number>();
  const itemIdsBySlug = new Map<string, number[]>();

  for (const collectionDef of COLLECTIONS) {
    const { id: collectionId } = await seedDemoAddCollection({
      slug: collectionDef.slug,
      title: collectionDef.title,
      description: collectionDef.description,
    });
    collectionIdsBySlug.set(collectionDef.slug, collectionId);

    for (const [position, field] of collectionDef.fields.entries()) {
      let relatedCollectionId: number | null = null;
      if (field.fieldType === "relation") {
        if (!field.relatedCollectionSlug) {
          throw new Error(
            `Relation field "${field.key}" on "${collectionDef.slug}" needs relatedCollectionSlug.`,
          );
        }
        relatedCollectionId =
          collectionIdsBySlug.get(field.relatedCollectionSlug) ?? null;
        if (relatedCollectionId === null) {
          throw new Error(
            `Related collection "${field.relatedCollectionSlug}" must be seeded before "${collectionDef.slug}".`,
          );
        }
      }

      await seedDemoAddCollectionField(collectionId, {
        key: field.key,
        label: field.label,
        fieldType: field.fieldType,
        position,
        required: field.required,
        isTitle: field.isTitle,
        relatedCollectionId,
      });
    }

    const fields = await seedDemoListCollectionFields(collectionId);
    const fieldByKey = new Map(fields.map((field) => [field.key, field.id]));

    let items = collectionDef.items;
    if (collectionDef.slug === "blog-content") {
      const authorIds = itemIdsBySlug.get("team-members") ?? [];
      items = BLOG_CONTENT_TITLES.map((entry, index) => ({
        title: entry.title,
        body: minimalRichtext(entry.body),
        author: authorIds.length > 0 ? authorIds[index % authorIds.length]! : null,
      }));
    }

    const createdItemIds: number[] = [];
    for (const item of items) {
      const { id } = await seedDemoInsertCollectionItem(
        collectionId,
        fieldByKey,
        item,
      );
      createdItemIds.push(id);
      itemCount += 1;
    }
    itemIdsBySlug.set(collectionDef.slug, createdItemIds);

    console.log(
      `  collection "${collectionDef.title}" (${items.length} items)`,
    );
  }

  return itemCount;
};

const main = async () => {
  const force = process.argv.includes("--force");

  const existingCollections = await seedDemoCountCollections();

  if (existingCollections > 0 && !force) {
    console.error(
      `Found ${existingCollections} collection(s). Refusing to seed. Pass --force to replace demo data.`,
    );
    process.exit(1);
  }

  if (force && existingCollections > 0) {
    console.log("Clearing existing collections and file metadata...");
    await seedDemoClearCollections();
    await seedDemoClearFileMetadata();
  }

  await ensureBucket();

  console.log("Seeding gradient images...");
  const imageIds = await seedDemoImages();

  console.log("Seeding collections and items...");
  const itemCount = await seedDemoCollections();

  console.log(
    `Done. Created ${imageIds.length} images, ${COLLECTIONS.length} collections, ${itemCount} items.`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
