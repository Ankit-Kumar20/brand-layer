export type WorkspaceBrand = {
  id: string;
  name: string;
  slug: string;
  brandTag: string;
  userId: string;
};

export type ApiKeyMeta = {
  id: string;
  name: string;
  prefix: string;
  recoverable: boolean;
  createdAt: string | Date;
};
