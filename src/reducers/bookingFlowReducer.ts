/**
 * Booking journey state (SPEC 16). It lives in the root layout so the seat
 * selection survives the detour to `/login`. Passenger details are kept here
 * between the passengers page and the summary. No storage.
 */

export type PassengerDetail = {
  seatId: string;
  name: string;
  email: string;
  phone: string;
};

export type BookingFlowState = {
  scheduleId: string | null;
  passengers: number;
  selectedSeatIds: string[];
  expiresAt: Date | null;
  passengerDetails: PassengerDetail[];
  /** Search context, for the "back to search" links. */
  from: string | null;
  to: string | null;
  date: string | null;
};

export const initialBookingFlowState: BookingFlowState = {
  scheduleId: null,
  passengers: 1,
  selectedSeatIds: [],
  expiresAt: null,
  passengerDetails: [],
  from: null,
  to: null,
  date: null,
};

export type BookingFlowAction =
  | {
      type: "startTrip";
      scheduleId: string;
      passengers: number;
      from?: string;
      to?: string;
      date?: string;
    }
  | { type: "toggleSeat"; seatId: string }
  | { type: "removeSeats"; seatIds: string[] }
  | { type: "holdStarted"; expiresAt: Date }
  | { type: "holdCleared" }
  | { type: "passengersSaved"; passengers: PassengerDetail[] }
  | { type: "reset" };

export function bookingFlowReducer(
  state: BookingFlowState,
  action: BookingFlowAction,
): BookingFlowState {
  switch (action.type) {
    case "startTrip": {
      // Same trip again (login return, re-render, reload): keep the selection.
      if (
        state.scheduleId === action.scheduleId &&
        state.passengers === action.passengers
      ) {
        return state;
      }

      return {
        ...initialBookingFlowState,
        scheduleId: action.scheduleId,
        passengers: action.passengers,
        from: action.from ?? null,
        to: action.to ?? null,
        date: action.date ?? null,
      };
    }

    case "toggleSeat": {
      if (state.selectedSeatIds.includes(action.seatId)) {
        return {
          ...state,
          selectedSeatIds: state.selectedSeatIds.filter(
            (id) => id !== action.seatId,
          ),
        };
      }

      // Never more than the passenger count the search asked for.
      if (state.selectedSeatIds.length >= state.passengers) return state;

      return {
        ...state,
        selectedSeatIds: [...state.selectedSeatIds, action.seatId],
      };
    }

    case "removeSeats": {
      if (action.seatIds.length === 0) return state;

      const removed = new Set(action.seatIds);
      const selectedSeatIds = state.selectedSeatIds.filter(
        (id) => !removed.has(id),
      );
      if (selectedSeatIds.length === state.selectedSeatIds.length) return state;

      return { ...state, selectedSeatIds };
    }

    case "holdStarted":
      return { ...state, expiresAt: action.expiresAt };

    case "holdCleared":
      return {
        ...state,
        expiresAt: null,
        selectedSeatIds: [],
        passengerDetails: [],
      };

    case "passengersSaved":
      return { ...state, passengerDetails: action.passengers };

    case "reset":
      return initialBookingFlowState;
  }
}