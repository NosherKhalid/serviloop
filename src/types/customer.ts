// iOS: like a Swift struct, but TypeScript checks only at compile time. Data arriving from
// the network is not validated by this type (Zod will do that when we add Supabase in M3).
// `string | null` mirrors a nullable database column; `null` means "no value", never `undefined`.
export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  createdAt: string; // UTC ISO timestamp
};
