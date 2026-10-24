"use client";

import { createContext, useContext, useReducer, type Dispatch } from "react";

import {
  bookingFlowReducer,
  initialBookingFlowState,
  type BookingFlowAction,
  type BookingFlowState,
} from "~/reducers/bookingFlowReducer";

type BookingFlowContextValue = {
  state: BookingFlowState;
  dispatch: Dispatch<BookingFlowAction>;
};

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

/**
 * Mounted in the root layout (SPEC 16) so the seat selection survives the
 * route change to `/login` and back.
 */
export function BookingFlowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(
    bookingFlowReducer,
    initialBookingFlowState,
  );

  return (
    <BookingFlowContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const context = useContext(BookingFlowContext);
  if (!context) {
    throw new Error("useBookingFlow must be used inside BookingFlowProvider");
  }
  return context;
}
