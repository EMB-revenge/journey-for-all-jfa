# Journey For All (JFA) — Product Requirements Document

**Date:** 2026-10-03
**Team:** Fletcher, Joe, Amiel
**Companion docs:** `docs/SPEC.md` (how it is built), `docs/IMPLEMENTATION-PLAN.md` (build order), `docs/TEAM-BRIEF.md` (shared picture)

This document covers what the product is and why. Tables, procedures, and stack choices live in the spec.

---

## 1. Overview

A web app for booking one-way intercity bus trips. A passenger searches by route and date, picks a trip, selects seats, enters passenger details, and receives a digital ticket. Administrators manage the bus fleet, routes, and schedules, and can see every booking.

The system demonstrates a working booking and ticketing product: authentication, relational data, transactional seat allocation, and admin CRUD.

## 2. Goals

- A guided flow from search to ticket with no dead ends
- A seat map that shows availability honestly, including seats held by other people mid-checkout
- A digital ticket issued immediately after booking
- One place for a passenger to see current and past bookings
- Full admin control over cities, buses, routes, and schedules
- Seat availability that stays accurate under two people booking the same seat

## 3. Users

**Passengers** book seats for themselves or others travelling with them. They register themselves, search, choose, pay nothing, and present a ticket.

**Administrators** are the three of us. We manage the fleet and schedule departures, and we read bookings to answer passenger questions.

## 4. Scope

### In the MVP

- Passenger registration, login, logout, change password
- Trip search by origin city, destination city, travel date, and passenger count (1–6)
- Results listing with departure and arrival times, bus type, fare, and seats remaining
- Seat selection with available, held, and occupied states
- Temporary seat holds with a visible countdown
- Passenger details per seat, booking summary, and confirmation
- Digital ticket with booking reference
- My Bookings, past and upcoming
- Admin dashboard: CRUD for cities, buses, routes, schedules; read-only view of all bookings

### Out of scope for now

Payments, cancellation, no-show and check-in, waitlists, overbooking, round trips, discounts, per-seat pricing, live tracking, SMS notifications, social login.

## 5. Functional requirements

### 5.1 Registration and login

Inputs: full name, email, password. The system validates the input, rejects duplicate emails, hashes the password, and creates the account with the passenger role. Login with valid credentials lands the passenger on search. Invalid credentials show an error and reveal nothing about whether the email exists. Any signed-in user can change their password with their current one.

### 5.2 Search

Inputs: origin city, destination city, travel date, passenger count. The date cannot be in the past, origin and destination must differ, and passenger count is 1 to 6. Results show only trips that have not departed, are not cancelled, and have at least that many free seats.

### 5.3 Seat selection

The seat map shows every seat on the bus with its state: available, held by someone else, occupied, or held by this passenger. A passenger selects exactly as many seats as the passenger count. Selecting a different number blocks Continue. Held-by-others seats cannot be selected.

### 5.4 Holds

Continue creates a 5-minute hold on the selected seats and starts a visible countdown. Holds free the seats automatically when they expire. If someone else takes a seat first, the passenger is told which seats are gone and returned to the seat map with fresh data.

### 5.5 Booking and ticket

Inputs: one name, email, and phone per selected seat. The summary shows the trip, seats, unit fare, and total before the passenger commits. Confirming issues a unique booking reference, stores the fare as it was at that moment, and displays the digital ticket. Later fare changes never alter an issued ticket.

### 5.6 My Bookings

A passenger sees their own bookings with trip details, seat numbers, fare paid, booking reference, and status, and can reopen any ticket.

### 5.7 Admin: fleet and schedules

Admins add, edit, and deactivate buses (name, plate number, capacity, bus type), routes (origin, destination, duration, base fare), and schedules (bus, route, date, departure and arrival times, optional fare override). Creating a bus creates its seats. Deleting anything that a booking already depends on is not allowed; those records get deactivated or cancelled instead.

### 5.8 Admin: bookings

Admins see all bookings with passenger and trip details and can filter by date or route. Admins do not edit or delete bookings.

## 6. Non-functional requirements

**Reliability.** The same seat cannot be sold twice on the same trip, even when two people confirm at the same instant. Booking writes are atomic: a booking never exists without its seats.

**Security.** Passwords are stored hashed and never logged. Authentication is required for booking and for every admin action. Admin screens and admin data are closed to passengers. The admin check runs on the server, not only in the UI.

**Performance.** A route and date search returns promptly. Seat maps and countdowns update without a page reload.

**Usability.** One linear path from search to ticket. The seat map's states are distinguishable at a glance. Errors say what happened and what to do next.

## 7. Flows

**Passenger:** log in → search → results → select trip → select seats → hold with countdown → passenger details → summary → confirm → ticket → My Bookings.

**Admin:** log in → dashboard → manage cities, buses, routes, schedules → review bookings.

## 8. Success metrics

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
- Both passengers and admins have reliable internet access

## 10. Out-of-MVP hooks

Leave room rather than build now: payment status transitions, cancellation and no-show as booking statuses instead of deletions, per-seat fare amounts for discounts, a second schedule on a booking for round trips.

## 11. Development process

1. **Requirements** finalized in this PRD and the spec, agreed by the three of us
2. **Build** on feature branches off `dev`, small commits, merge often
3. **Review** before merging: one teammate reads the diff against the spec
4. **Test** manually against the success metrics, plus unit tests where logic gets non-obvious
5. **Deploy** `dev` continuously, `main` when a phase is done, verify the live URL each time
