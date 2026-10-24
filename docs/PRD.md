# Journey For All (JFA) — Product Requirements Document

**Date:** 2026-10-03
**Team:** Fletcher, Joe, Amiel
**Companion docs:** `docs/SPEC.md` (how it is built), `docs/IMPLEMENTATION-PLAN.md` (build order), `docs/TEAM-BRIEF.md` (shared picture)

This document covers what the product is and why. Tables, procedures, and stack choices live in the spec.

---

## 1. Overview

A web app for booking one-way intercity(In Panay Island for now) bus trips. A passenger searches by route and date, picks a trip, selects seats (1–6), enters passenger details per seat, and receives a digital ticket. Administrators manage the bus fleet, routes, schedules, and cities, and can view all bookings.

The system demonstrates a working booking and ticketing product: authentication, relational data, transactional seat allocation with temporary holds, and admin CRUD.

## 2. Goals

- A guided flow from search to ticket with no dead ends
- A seat map that shows availability honestly (available vs occupied)
- Temporary seat holds (5 min) with a visible countdown to prevent conflicts mid-checkout
- A digital ticket issued immediately after booking
- One place for a passenger to see current and past bookings
- Full admin control over cities, buses, routes, and schedules via a consistent sidebar-driven CRUD layout
- Seat availability that stays accurate under concurrent bookings

## 3. Users

**Passengers** book seats for themselves or others travelling with them. They register, search, choose seats, enter details per seat, and present a ticket.

**Administrators** are the three of us. We manage the fleet, cities, and schedule departures, and we read bookings to answer passenger questions. Booking status is managed automatically by the system (no manual confirm/cancel dropdown needed).

## 4. Scope

### In the MVP

- Passenger registration, login, logout, change password
- Trip search by origin city, destination city, travel date, and passenger count (1–6)
- Results listing with departure and arrival times, bus type, fare, and seats remaining
- Seat selection with **available** and **occupied** states only (no held-by-other/held-by-me distinction in UI)
- Temporary seat holds (5 min) with visible countdown; holds auto-expire and free seats
- Passenger details per seat (name, email, phone), booking summary, and confirmation
- Digital ticket with booking reference
- My Bookings: past and upcoming
- Admin sidebar navigation: Cities | Buses | Routes | Schedules | Bookings (no separate dashboard home)
- Admin CRUD for cities, buses, routes, schedules using a consistent table + form pattern
- Admin read-only view of all bookings with filtering by date/route

### Out of scope for now

Payments, cancellation, no-show and check-in, waitlists, overbooking, round trips, discounts, per-seat pricing, live tracking, SMS notifications, social login.

## 5. Functional Requirements

### 5.1 Registration and Login

Inputs: full name, email, password. The system validates input, rejects duplicate emails, hashes the password, and creates the account with the passenger role. Login with valid credentials lands the passenger on search. Invalid credentials show an error and reveal nothing about whether the email exists. Any signed-in user can change their password with their current one. An account is not needed to browse: search, results, and the seat map are open, and sign-in is required at the hold step, where the system first writes on the passenger's behalf.

### 5.2 Search

Inputs: origin city, destination city, travel date, passenger count (1–6). The date cannot be in the past, origin and destination must differ. Results show only trips that have not departed, are not cancelled, and have at least that many free seats. Each result shows departure/arrival times, bus type, fare, and seats remaining. No account is required to search or to open a seat map.

### 5.3 Seat Selection

The seat map shows every seat on the bus with its state: **available** or **occupied**. A passenger selects exactly as many seats as the passenger count. Selecting a different number blocks Continue. Occupied seats cannot be selected.

### 5.4 Holds

Continue creates a 5-minute hold on the selected seats and starts a visible countdown. Holds free the seats automatically when they expire. If someone else takes a seat first, the passenger is told which seats are gone and returned to the seat map with fresh data.

### 5.5 Booking and Ticket

Inputs: one name, email, and phone per selected seat. The summary shows the trip, seats, unit fare, and total before the passenger commits. Confirming issues a unique booking reference, stores the fare as it was at that moment, and displays the digital ticket. Later fare changes never alter an issued ticket.

### 5.6 My Bookings

A passenger sees their own bookings with trip details, seat numbers, fare paid, booking reference, and status, and can reopen any ticket.

### 5.7 Admin: Cities, Fleet and Schedules

Admins manage four entities via the sidebar, each using the same pattern: table of records, "Add" button opens a form, Edit/Delete per row.

- **Cities**: add, edit, deactivate (name)
- **Buses**: add, edit, deactivate (name, plate number, capacity, bus type: Aircon or Ordinary / non-aircon). Creating a bus auto-generates its seats (numbered 1..capacity).
- **Routes**: add, edit, deactivate (origin city, destination city, duration, base fare)
- **Schedules**: add, edit, deactivate (bus, route, date, departure time, arrival time). **No fare override** — schedule uses the route's base fare.
- Deleting anything that a booking already depends on is not allowed; those records get deactivated instead.

### 5.8 Admin: Bookings

Admins see all bookings with passenger and trip details and can filter by date or route. **Read-only** — status transitions (Confirmed/Cancelled) are handled automatically by the system, not manually by admins.

## 6. Non-Functional Requirements

**Reliability.** The same seat cannot be sold twice on the same trip, even when two people confirm at the same instant. Booking writes are atomic: a booking never exists without its seats.

**Security.** Passwords are stored hashed and never logged. Authentication is required at the first write, the seat hold, and for every admin action. Admin screens and admin data are closed to passengers. The admin check runs on the server, not only in the UI.

**Performance.** A route and date search returns promptly. Seat maps and countdowns update without a page reload.

**Usability.** One linear path from search to ticket. The seat map's states are distinguishable at a glance. Errors say what happened and what to do next.

## 7. Flows

**Passenger:** search → results → select trip → select seats → sign in → hold with countdown → passenger details → summary → confirm → ticket → My Bookings.

**Admin:** log in → sidebar → manage cities, buses, routes, schedules → review bookings.

## 8. Success Metrics

- A passenger completes a booking from search to ticket without errors
- No seat is ever double-booked on a schedule
- Every booking reference is unique
- Admins manage the fleet and schedules without orphan data
- Registration and login succeed for valid input
- An abandoned hold frees its seats

## 9. Assumptions

- Payment happens outside the system for this MVP; bookings confirm immediately
- One account per email address
- A schedule belongs to exactly one bus on exactly one route at a given departure time
- Seats are numbered sequentially from 1 with no separate classes or prices
- Bus type is Aircon or Ordinary (non-aircon) only; no Deluxe/Sleeper tiers in the MVP
- Both passengers and admins have reliable internet access
- Admin accounts are seeded/created manually; self-service admin signup is out of scope

## 10. Out-of-MVP Hooks

Leave room rather than build now: payment status transitions, cancellation and no-show as booking statuses instead of deletions, per-seat fare amounts for discounts, a second schedule on a booking for round trips.

## 11. Development Process

1. **Requirements** finalized in this PRD and the spec, agreed by the three of us
2. **Build** on feature branches off `dev`, small commits, merge often
3. **Review** before merging: one teammate reads the diff against the spec
4. **Test** manually against the success metrics, plus unit tests where logic gets non-obvious
5. **Deploy** `dev` continuously, `main` when a phase is done, verify the live URL each time

## 12. Git Branch Strategy

- `main` → Production-ready code
- `dev` → Integration / testing
- Feature branches → Temporary development work