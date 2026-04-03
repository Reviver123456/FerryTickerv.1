"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type {
  AuthUser,
  BookingDraft,
  BookingHistoryRecord,
  BookingState,
  ContactInfo,
  PassengerForm,
  PaymentInfo,
  ScheduleSummary,
  SearchCriteria,
  SelectedTicketItem,
  TicketLookupResult,
} from "@/lib/app-types";
import { createDefaultPassenger, createEmptyContactInfo, fetchMyBookings, getTodayDateKey } from "@/lib/ferry";
import {
  APP_LANGUAGE_STORAGE_KEY,
  DEFAULT_APP_LANGUAGE,
  getDocumentLanguage,
  isAppLanguage,
  resolveBrowserLanguage,
  type AppLanguage,
} from "@/lib/i18n";

type AppContextValue = {
  authUser: AuthUser | null;
  booking: BookingState;
  isHydrated: boolean;
  language: AppLanguage;
  setAuthUser: (user: AuthUser | null) => void;
  setLanguage: (language: AppLanguage) => void;
  logout: () => void;
  updateSearch: (partial: Partial<SearchCriteria>) => void;
  setSelectedSchedule: (schedule: ScheduleSummary | null) => void;
  setSelectedTickets: (items: SelectedTicketItem[]) => void;
  setDraft: (draft: BookingDraft | null) => void;
  setContact: (contact: ContactInfo) => void;
  setPassengers: (passengers: PassengerForm[]) => void;
  setPayment: (payment: PaymentInfo | null) => void;
  addRecentBooking: (record: BookingHistoryRecord) => void;
  setLastLookup: (lookup: TicketLookupResult | null) => void;
  resetCurrentBooking: () => void;
};

const AUTH_STORAGE_KEY = "ferry-ticket-auth";
const BOOKING_STORAGE_KEY = "ferry-ticket-booking";

const AppContext = createContext<AppContextValue | null>(null);

function createDefaultSearch(): SearchCriteria {
  return {
    travelDate: getTodayDateKey(),
    timeFilter: "all",
    passengers: 1,
  };
}

function createDefaultBookingState(): BookingState {
  return {
    search: createDefaultSearch(),
    selectedSchedule: null,
    selectedTickets: [],
    draft: null,
    contact: createEmptyContactInfo(),
    passengers: [createDefaultPassenger()],
    payment: null,
    recentBookings: [],
    lastLookup: null,
  };
}

function readStorage<T>(key: string) {
  if (typeof window === "undefined") {
    return null as T | null;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return null as T | null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null as T | null;
  }
}

function readLanguageStorage() {
  if (typeof window === "undefined") {
    return null as AppLanguage | null;
  }

  const raw = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);

  return isAppLanguage(raw) ? raw : null;
}

function syncPassengers(existing: PassengerForm[], count: number) {
  if (count <= 0) {
    return [createDefaultPassenger()];
  }

  if (existing.length === count) {
    return existing;
  }

  if (existing.length > count) {
    return existing.slice(0, count);
  }

  return [
    ...existing,
    ...Array.from({ length: count - existing.length }, () => createDefaultPassenger()),
  ];
}

function mergeRecentBookings(localBookings: BookingHistoryRecord[], remoteBookings: BookingHistoryRecord[]) {
  const merged = [...remoteBookings, ...localBookings];
  const deduped = merged.filter(
    (record, index) => merged.findIndex((candidate) => candidate.bookingNo === record.bookingNo) === index,
  );

  return deduped.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUserState] = useState<AuthUser | null>(null);
  const [booking, setBooking] = useState<BookingState>(() => createDefaultBookingState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_APP_LANGUAGE);

  useEffect(() => {
    const storedAuth = readStorage<AuthUser>(AUTH_STORAGE_KEY);
    const storedBooking = readStorage<BookingState>(BOOKING_STORAGE_KEY);
    const storedLanguage = readLanguageStorage() ?? resolveBrowserLanguage(window.navigator.languages);

    if (storedAuth) {
      setAuthUserState(storedAuth);
    }

    if (storedBooking) {
      setBooking({
        ...createDefaultBookingState(),
        ...storedBooking,
        search: {
          ...createDefaultSearch(),
          ...storedBooking.search,
        },
        contact: {
          ...createEmptyContactInfo(),
          ...storedBooking.contact,
        },
        passengers:
          storedBooking.passengers && storedBooking.passengers.length > 0
            ? storedBooking.passengers
            : [createDefaultPassenger()],
        recentBookings: storedBooking.recentBookings ?? [],
      });
    }

    setLanguageState(storedLanguage);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    if (authUser) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [authUser, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
  }, [booking, isHydrated]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.lang = getDocumentLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  }, [isHydrated, language]);

  useEffect(() => {
    if (!isHydrated || !authUser) {
      return;
    }

    const currentUser = authUser;
    let ignore = false;

    async function loadRemoteBookings() {
      try {
        const remoteBookings = await fetchMyBookings(currentUser);

        if (ignore) {
          return;
        }

        setBooking((current) => ({
          ...current,
          recentBookings: mergeRecentBookings(current.recentBookings, remoteBookings),
        }));
      } catch {
        // Keep local history as a fallback when the backend list endpoint is unavailable.
      }
    }

    void loadRemoteBookings();

    return () => {
      ignore = true;
    };
  }, [authUser, isHydrated]);

  const value = useMemo<AppContextValue>(
    () => ({
      authUser,
      booking,
      isHydrated,
      language,
      setAuthUser: (user) => {
        setAuthUserState(user);

        if (user) {
          setBooking((current) => ({
            ...current,
            contact: {
              fullName: current.contact.fullName || user.fullName,
              phone: current.contact.phone || user.phone,
              email: current.contact.email || user.email,
            },
          }));
        }
      },
      setLanguage: (nextLanguage) => {
        setLanguageState(nextLanguage);
      },
      logout: () => {
        setAuthUserState(null);
        setBooking((current) => ({
          ...current,
          contact: createEmptyContactInfo(),
        }));
      },
      updateSearch: (partial) => {
        setBooking((current) => ({
          ...current,
          search: {
            ...current.search,
            ...partial,
          },
        }));
      },
      setSelectedSchedule: (schedule) => {
        setBooking((current) => ({
          ...current,
          selectedSchedule: schedule,
          selectedTickets: [],
          draft: null,
          payment: null,
          passengers: syncPassengers(current.passengers, current.search.passengers),
        }));
      },
      setSelectedTickets: (items) => {
        const totalPassengers = items.reduce((sum, item) => sum + item.quantity, 0);

        setBooking((current) => ({
          ...current,
          selectedTickets: items,
          draft: null,
          payment: null,
          passengers: syncPassengers(current.passengers, totalPassengers),
        }));
      },
      setDraft: (draft) => {
        setBooking((current) => ({
          ...current,
          draft,
        }));
      },
      setContact: (contact) => {
        setBooking((current) => ({
          ...current,
          contact,
        }));
      },
      setPassengers: (passengers) => {
        setBooking((current) => ({
          ...current,
          passengers: passengers.length > 0 ? passengers : [createDefaultPassenger()],
        }));
      },
      setPayment: (payment) => {
        setBooking((current) => ({
          ...current,
          payment,
        }));
      },
      addRecentBooking: (record) => {
        setBooking((current) => {
          const filtered = current.recentBookings.filter((item) => item.bookingNo !== record.bookingNo);

          return {
            ...current,
            recentBookings: [record, ...filtered].slice(0, 10),
          };
        });
      },
      setLastLookup: (lookup) => {
        setBooking((current) => ({
          ...current,
          lastLookup: lookup,
        }));
      },
      resetCurrentBooking: () => {
        setBooking((current) => ({
          ...current,
          selectedSchedule: null,
          selectedTickets: [],
          draft: null,
          contact: authUser
            ? {
                fullName: authUser.fullName,
                phone: authUser.phone,
                email: authUser.email,
              }
            : createEmptyContactInfo(),
          passengers: [createDefaultPassenger()],
          payment: null,
        }));
      },
    }),
    [authUser, booking, isHydrated, language],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }

  return context;
}
