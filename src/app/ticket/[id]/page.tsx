import { TicketDetail } from "../../components/pages/TicketDetail";

const ticketIds = ["1", "2", "3"];

export function generateStaticParams() {
  return ticketIds.map((id) => ({ id }));
}

export const dynamicParams = false;

export default function TicketDetailPage() {
  return <TicketDetail />;
}
