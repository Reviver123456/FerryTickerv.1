export type TimeFilter = "all" | "morning" | "afternoon" | "evening";

export type PassengerType = "adult" | "child";

export type AuthUser = {
  fullName: string;
  phone: string;
  email: string;
  profileImageUrl?: string;
  accessToken?: string;
  raw?: unknown;
};

export type SearchCriteria = {
  travelDate: string;
  timeFilter: TimeFilter;
  passengers: number;
};

export type ScheduleSummary = {
  id: string;
  routeName: string;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  departureAt?: string;
  availableSeats: number;
  totalSeats: number | null;
  price: number;
  status: string;
  recommended: boolean;
  raw?: unknown;
};

export type TicketTypeOption = {
  id: string;
  name: string;
  price: number;
  description: string;
  benefits: string[];
  passengerType: PassengerType;
  highlight: boolean;
  raw?: unknown;
};

export type SelectedTicketItem = {
  ticketTypeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  passengerType: PassengerType;
};

export type ContactInfo = {
  fullName: string;
  phone: string;
  email: string;
};

export type PassengerForm = {
  id: string;
  fullName: string;
  passengerType: PassengerType;
};

export type BookingDraft = {
  bookingNo: string;
  scheduleId: string;
  items: SelectedTicketItem[];
  raw?: unknown;
};

export type PaymentInfo = {
  paymentRef?: string;
  method: string;
  amount: number;
  qrCodeUrl?: string;
  qrCodeText?: string;
  status?: string;
  raw?: unknown;
};

export type TicketRecord = {
  ticketNo: string;
  qrToken: string;
  qrImageUrl?: string;
  passengerName: string;
  passengerType: string;
  status: string;
  bookingNo: string;
  travelDate: string;
  travelTime: string;
  gateCode?: string;
  raw?: unknown;
};

export type BookingHistoryRecord = {
  bookingNo: string;
  contactEmail: string;
  contactName: string;
  contactPhone: string;
  primaryPassengerName?: string;
  scheduleDate: string;
  scheduleTime: string;
  passengers: number;
  totalAmount: number;
  paymentMethod?: string;
  paymentRef?: string;
  status: string;
  tickets: TicketRecord[];
  updatedAt: string;
};

export type TicketLookupResult = {
  bookingNo: string;
  contactEmail: string;
  tickets: TicketRecord[];
};

export type BookingState = {
  search: SearchCriteria;
  selectedSchedule: ScheduleSummary | null;
  selectedTickets: SelectedTicketItem[];
  draft: BookingDraft | null;
  contact: ContactInfo;
  passengers: PassengerForm[];
  payment: PaymentInfo | null;
  recentBookings: BookingHistoryRecord[];
  lastLookup: TicketLookupResult | null;
};
