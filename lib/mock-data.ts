import type { Album, Category, Photo } from "@/types/album";

export const categories: Category[] = [
  { id: "cat-bags", name: "Bags", slug: "bags", createdAt: "2026-05-01" },
  { id: "cat-wallets", name: "Wallets", slug: "wallets", createdAt: "2026-05-01" },
  { id: "cat-shoes", name: "Shoes", slug: "shoes", createdAt: "2026-05-01" },
  {
    id: "cat-new",
    name: "New Arrivals",
    slug: "new-arrivals",
    createdAt: "2026-05-01"
  }
];

export const albums: Album[] = [
  {
    id: "album-bags-2026",
    title: "Bags 2026",
    slug: "bags-2026",
    description: "A curated product set for private client preview.",
    coverImage:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-bags",
    isPublic: true,
    createdAt: "2026-05-20"
  },
  {
    id: "album-wallets-classic",
    title: "Classic Wallets",
    slug: "classic-wallets",
    description: "Compact styles in neutral finishes.",
    coverImage:
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-wallets",
    password: "demo",
    isPublic: false,
    createdAt: "2026-05-21"
  },
  {
    id: "album-shoes-edit",
    title: "Shoes Edit",
    slug: "shoes-edit",
    description: "Selected pairs for current customer orders.",
    coverImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    categoryId: "cat-shoes",
    isPublic: true,
    createdAt: "2026-05-23"
  }
];

const albumId = "album-bags-2026";

export const photos: Photo[] = [
  {
    id: "photo-001",
    albumId,
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=70",
    sortOrder: 1,
    imageCode: "BAG-001",
    mimeType: "image/jpeg",
    fileSize: 420000,
    width: 1200,
    height: 1500,
    createdAt: "2026-05-20"
  },
  {
    id: "photo-002",
    albumId,
    imageUrl:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=700&q=70",
    sortOrder: 2,
    imageCode: "BAG-002",
    mimeType: "image/jpeg",
    fileSize: 460000,
    width: 1200,
    height: 900,
    createdAt: "2026-05-20"
  },
  {
    id: "photo-003",
    albumId,
    imageUrl:
      "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1605733160314-4fc7dac4bb16?auto=format&fit=crop&w=700&q=70",
    sortOrder: 3,
    imageCode: "BAG-003",
    mimeType: "image/jpeg",
    fileSize: 390000,
    width: 1200,
    height: 1600,
    createdAt: "2026-05-20"
  },
  {
    id: "photo-004",
    albumId,
    imageUrl:
      "https://images.unsplash.com/photo-1575890318083-4d7c6ebcd60a?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1575890318083-4d7c6ebcd60a?auto=format&fit=crop&w=700&q=70",
    sortOrder: 4,
    imageCode: "BAG-004",
    mimeType: "image/jpeg",
    fileSize: 410000,
    width: 1200,
    height: 1000,
    createdAt: "2026-05-20"
  }
];
