import { CATEGORIES } from "@/data/categories";
import type { CategoryId } from "@/types";
import { ReservationFlow } from "./_components/ReservationFlow";

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.id));

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.categoria) ? params.categoria[0] : params.categoria;
  const initialCategoryId =
    raw && VALID_CATEGORIES.has(raw) ? (raw as CategoryId) : null;

  return <ReservationFlow initialCategoryId={initialCategoryId} />;
}
