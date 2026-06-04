import { ConfirmedView } from "./ConfirmedView";

export default async function ConfirmadaPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const params = await searchParams;
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? null);
  return <ConfirmedView id={id ?? null} />;
}
