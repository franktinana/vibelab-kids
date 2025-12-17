import GameClient from "./GameClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameClient gameId={id} />;
}
