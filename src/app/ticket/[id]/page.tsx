import { TicketDetail } from "../../components/pages/TicketDetail";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return <TicketDetail ticketId={params.id} />;
}
