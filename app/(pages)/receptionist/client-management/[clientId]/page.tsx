import ClientProfilePage from "@/components/ClientProfilePage";

type Props = {
  params: Promise<{ clientId: string }>;
};

export default async function ReceptionistClientProfilePage({ params }: Props) {
  const { clientId } = await params;
  return <ClientProfilePage clientId={clientId} />;
}
