# Golden Express Bus Ticket Booking System

## Ten-Day Progress Report

**Project:** Online bus-ticket booking and management system  
**Duration:** Ten days  
**Prepared by:** ____________________  
**Reporting period:** ____________________  

## 1. Project Overview

A web-based booking system was developed for Golden Express bus services in Cameroon, with attention given to routes in the Southwest region. Through the system, routes can be searched, seats can be viewed and selected, passenger details can be submitted, and booking confirmations can be received. Staff access was also provided for administration, bus management, booking review, and role-based dashboards.

The work completed during the ten-day development period is presented below. Each day contains the main tasks completed during that reporting day.

## 2. Technology Used

- Next.js with the App Router
- React and TypeScript
- Tailwind CSS
- PostgreSQL
- Session-based authentication and role protection
- API routes for buses, bookings, login, signup, and data seeding
- pnpm for package management

## 3. Daily Progress Breakdown

### Day 1: Project Planning and Initial Setup

**Task 1 – Requirements review**  
The business requirements of a bus-ticket booking platform were reviewed. The main users were identified as customers, administrators, managers, and drivers. The workflow from route search to booking confirmation was defined.

**Task 2 – System architecture planning**  
The system architecture was prepared and divided into client, API, business logic, data, and external integration layers.

**Task 3 – Technology selection**  
Next.js, React, TypeScript, Tailwind CSS, PostgreSQL, and server-side API routes were selected for the project.

**Task 4 – Project structure setup**  
The application was organized with the Next.js App Router. Folders were created for pages, UI components, API routes, database utilities, authentication, and booking data.

**Task 5 – Initial interface planning**  
The public landing page, booking pages, authentication pages, and staff dashboard pages were outlined. A consistent visual direction was established.

**Day 1 result:** The project scope, architecture, technology stack, and application structure were established.

### Day 2: Public Website and User Interface

**Task 1 – Landing page development**  
The main Golden Express landing page was created with service information, calls to action, route-search access, and staff login links.

**Task 2 – Branding and visual styling**  
The main colors, typography, spacing, cards, buttons, and background sections were added to the interface.

**Task 3 – Responsive layouts**  
The page layouts were adjusted for mobile, tablet, and desktop screen sizes. Navigation, cards, forms, and content spacing were checked.

**Task 4 – Reusable UI components**  
Reusable buttons, search elements, dashboard navigation, loading skeletons, and shared interface components were implemented.

**Task 5 – Basic navigation testing**  
Links between the home page, booking page, customer login, customer signup, and staff login pages were tested. Navigation issues were corrected.

**Day 2 result:** A usable and responsive public-facing interface was made available to customers and staff.

### Day 3: Database and Data Model

**Task 1 – Data model definition**  
The main system entities were defined, including customers, staff users, routes, seats, buses, and bookings.

**Task 2 – PostgreSQL connection**  
The PostgreSQL connection was configured through environment variables, and a shared database utility was created.

**Task 3 – Authentication tables**  
Database support was added for staff users and customer accounts. Names, email addresses, password data, phone numbers, and user roles were included.

**Task 4 – Booking tables and relationships**  
The route, seat, and booking structures were added. Connections between trips, seats, passenger information, payment methods, booking status, and booking references were established.

**Task 5 – Database setup verification**  
Database checking and seeding support was created so that the required tables and route data could be created and verified.

**Day 3 result:** The core database structure and server-side database access were prepared.

### Day 4: Route Search and Availability

**Task 1 – Route data preparation**  
Sample Golden Express routes were added with origins, destinations, dates, departure times, arrival times, durations, bus names, fares, and amenities.

**Task 2 – Route retrieval functions**  
Server-side functions were implemented for retrieving all routes and retrieving individual routes by identifier.

**Task 3 – Search form development**  
A route search form was created with fields for origin, destination, and travel date.

**Task 4 – Search filtering**  
The search form was connected to the database query, and routes were filtered by origin, destination, and travel date.

**Task 5 – Route results interface**  
Route cards were displayed with bus information, trip times, duration, fare, amenities, and booking links. A clear message was added for empty search results.

**Day 4 result:** Routes could be searched and selected by customers.

### Day 5: Customer Registration and Login

**Task 1 – Customer signup page**  
A customer registration form was built for name, email address, phone number, and password information.

**Task 2 – Customer signup API**  
The customer signup endpoint was implemented. Required information was validated, and duplicate email addresses were handled.

**Task 3 – Customer login page**  
The customer login interface was created and connected to the customer authentication endpoint.

**Task 4 – Customer sessions**  
Customer session handling was added so that signed-in customers could continue into the booking workflow.

**Task 5 – Protected booking access**  
Access to the route booking page was restricted to authenticated customers. Unauthenticated users were redirected to the customer login page.

**Day 5 result:** Customer account creation, login, sessions, and protected booking access were completed.

### Day 6: Seat Selection and Booking Workflow

**Task 1 – Route details page**  
A route-specific booking page was created. The selected trip, bus, travel date, times, duration, fare, and amenities were displayed.

**Task 2 – Seat selection interface**  
Seats were displayed with labels, types, prices, availability statuses, and selected or unselected visual states.

**Task 3 – Booking summary**  
A live booking summary was added. The selected trip, travel date, number of seats, and total price were displayed.

**Task 4 – Passenger information form**  
Fields were added for passenger name, email address, phone number, and payment method.

**Task 5 – Client-side validation**  
Validation was added to require at least one available seat and the required passenger details before submission.

**Day 6 result:** The customer-side booking form was prepared for submission.

### Day 7: Booking API and Confirmation

**Task 1 – Booking API implementation**  
A booking API endpoint was created to receive the route, selected seats, passenger details, and payment method.

**Task 2 – Input validation and normalization**  
Booking requests were validated, duplicate seat identifiers were removed, required fields were checked, and clear error responses were returned.

**Task 3 – Seat availability protection**  
A database transaction was added to verify selected seats and prevent unavailable seats from being booked.

**Task 4 – Booking record creation**  
The total fare was calculated, a booking reference was generated, passenger and payment information was stored, and selected seats were marked as unavailable.

**Task 5 – Confirmation page**  
A booking confirmation page was created and connected to the booking reference. Confirmed trip details were made available for review.

**Day 7 result:** Bookings could be submitted and confirmation references could be issued.

### Day 8: Staff Authentication and Role Dashboards

**Task 1 – Staff authentication**  
Staff login and signup support was added for administrator, manager, and driver roles.

**Task 2 – Role-based sessions**  
Staff session handling and role checks were implemented to control access to protected staff areas.

**Task 3 – Administrator dashboard**  
An administrator dashboard was created with ticket-sales, active-route, support, booking, bus-management, and database-seeding actions.

**Task 4 – Manager dashboard**  
A manager dashboard was created with fleet activity, daily ticket, and late-departure indicators.

**Task 5 – Driver dashboard**  
A driver dashboard was created with assigned-route, departure-time, and seat-occupancy information.

**Day 8 result:** Separate authenticated entry points and role-specific dashboards were provided for staff users.

### Day 9: Bus and Booking Administration

**Task 1 – Bus management interface**  
A bus administration page was created for viewing fleet information and entering bus number, type, capacity, and amenity details.

**Task 2 – Bus API operations**  
API operations were implemented for listing, creating, updating, and deleting bus records.

**Task 3 – Booking administration page**  
A staff booking list was created with booking references, passenger details, routes, selected seats, fares, and booking statuses.

**Task 4 – Booking detail access**  
Booking records were connected to their confirmation pages so that individual booking information could be reviewed by staff.

**Task 5 – Administrative workflow testing**  
Access control, bus forms, booking displays, logout actions, and links between staff pages and the customer booking flow were tested.

**Day 9 result:** Core administrative operations for buses and bookings were made available for testing.

### Day 10: Testing, Integration, and Documentation

**Task 1 – End-to-end booking test**  
The complete workflow was tested, including customer registration, login, route search, route selection, seat selection, passenger details, booking submission, and confirmation.

**Task 2 – Error and edge-case testing**  
Empty search results, missing form values, unavailable seats, invalid booking requests, duplicate seat selections, and unsuccessful login attempts were checked.

**Task 3 – Database and API verification**  
Database setup, route seeding, seat-availability updates, booking retrieval, and API responses were verified.

**Task 4 – Interface quality review**  
Responsive behavior, labels, feedback messages, loading states, button states, colors, spacing, and general usability were reviewed.

**Task 5 – Project documentation and handover**  
Project documentation was updated with setup instructions, database requirements, seed instructions, system roles, and future improvements.

**Day 10 result:** The main system workflow was integrated, tested, documented, and prepared for further refinement or deployment.

## 4. Overall Progress Summary

The following features were completed during the ten-day period:

- A public Golden Express landing page was created.
- Route search by origin, destination, and travel date was implemented.
- Route details and available seats were displayed.
- Customer signup, login, and protected booking access were provided.
- Seat selection and fare calculation were implemented.
- Passenger details and payment-method selection were added.
- Transaction-based booking creation was implemented.
- Booking references and confirmation pages were created.
- Staff login and role-based access were added.
- Administrator, manager, and driver dashboards were created.
- Bus management operations were implemented.
- Staff booking review was provided.
- PostgreSQL database setup, checking, and seed support were added.
- Responsive styling was applied to different screen sizes.

## 5. Remaining Improvements and Future Work

The following improvements are recommended for a future phase:

- Live card or mobile-money payment integration
- Email and SMS ticket notifications
- Ticket downloading or printing
- Booking cancellation and refund handling
- Stronger password hashing and production-grade session security
- More detailed manager and driver operations
- Route and schedule editing from the admin panel
- Automated tests and continuous integration
- Production deployment, monitoring, backups, and audit logs
- Redis-based seat locking during high-traffic booking periods

## 6. Conclusion

A functional foundation for an online bus-ticket booking and management system was produced during the ten-day development period. The customer booking journey and the main staff workflows were implemented, while a database and API structure was established for future payment, notification, reporting, and production-readiness features.
