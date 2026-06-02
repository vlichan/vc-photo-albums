import { albums, categories, photos } from "@/lib/mock-data";

export function getAlbumBySlug(slug: string) {
  return albums.find((album) => album.slug === slug);
}

export function getAlbumPhotos(albumId: string) {
  return photos
    .filter((photo) => photo.albumId === albumId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryName(categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Uncategorized";
}
