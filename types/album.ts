export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  albumCount?: number;
  sortOrder?: number | null;
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  categoryId: string;
  password?: string;
  isPublic: boolean;
  createdAt: string;
};

export type AlbumWithCategory = Album & {
  categoryName: string;
  photoCount?: number;
};

export type Photo = {
  id: string;
  albumId: string;
  imageUrl: string;
  thumbnailUrl: string;
  sortOrder: number;
  imageCode: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: string;
};
