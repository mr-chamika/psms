import ClientProfilePage from "@/components/ClientProfilePage";

type Props = {
  params: Promise<{ clientId: string }>;
};

export default async function AdminClientProfilePage({ params }: Props) {
  const { clientId } = await params;
  return <ClientProfilePage clientId={clientId} />;
}
