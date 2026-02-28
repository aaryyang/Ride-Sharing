# Ride Creation to Completion — Data Flow & Architecture

**Role:** Senior System Architect  
**Scope:** GreenCommute — Ride lifecycle from creation to completion

---

## 1. Step-by-Step Data Flow: Ride Lifecycle

### Phase 1: Ride creation

| Step | Actor | Action |
|------|--------|--------|
| 1 | Client | `POST /api/rides/create` with body: `{ origin, destination, departureTime, seatsAvailable, vehicleType }` and header `Authorization: Bearer <JWT>` |
| 2 | **server.js** | Request hits `app.use('/api/rides', rideRoutes)` → forwarded to **routes/ride.js** |
| 3 | **routes/ride.js** | Matches `POST /create`, runs **protect** then **createRide** |
| 4 | **authMiddleware.js** | `protect`: reads `Authorization`, verifies JWT, loads user, sets **req.user** |
| 5 | **rideController.js** | `createRide`: reads `req.user._id` (driver), creates **Ride** in DB, returns 201 + ride |

**Hand-off:** `authMiddleware` sets `req.user` (full user doc minus password). `rideController.createRide` uses `req.user._id` as `driver`. No explicit “user_id” argument; it’s implicit via `req`.

---

### Phase 2: Search / match (discovery)

| Step | Actor | Action |
|------|--------|--------|
| 1 | Client | **Search:** `GET /api/rides/search?origin=...&destination=...&vehicleType=...` with Bearer token. **Match:** `POST /api/rides/match` with `{ origin, destination }` (no auth) |
| 2 | **server.js** | Same mount `/api/rides` → **routes/ride.js** |
| 3 | **routes/ride.js** | Search: `protect` → **rideController.searchRides**. Match: no protect → **rideController.findMatches** |
| 4 | **rideController.js** | Both use **Ride** model: `find()` with filters (origin, destination, seatsAvailable > 0), optionally `populate('driver')`, return JSON |

**Hand-off:** For search, `protect` again sets `req.user` (not used in search logic, only for access). Controllers receive `req.query` (search) or `req.body` (match) and use **Ride** model only.

---

### Phase 3: Join ride

| Step | Actor | Action |
|------|--------|--------|
| 1 | Client | `POST /api/rides/:rideId/join` with Bearer token (no body required) |
| 2 | **server.js** | `/api/rides` → **routes/ride.js** |
| 3 | **routes/ride.js** | Matches `POST /:rideId/join`, runs **protect** then **joinRide** |
| 4 | **authMiddleware.js** | `protect`: sets **req.user** |
| 5 | **rideController.js** | `joinRide`: reads **req.params.rideId**, **req.user._id**; loads Ride, checks seats and duplicate join; pushes `userId` into `ride.passengers`, decrements `seatsAvailable`, saves Ride |

**Hand-off:** Route passes `req` (with `req.user` from protect and `req.params.rideId`). Controller uses `req.user._id` as the joining passenger.

---

### Phase 4: Complete ride

| Step | Actor | Action |
|------|--------|--------|
| 1 | Client | `POST /api/rides/complete` with body: `{ rideId, riderId, driverId, distanceKm, riderRating?, driverRating? }` and Bearer token |
| 2 | **server.js** | `/api/rides` → **routes/ride.js** |
| 3 | **routes/ride.js** | Matches `POST /complete`, runs **protect** then **completeRide** (from **rideCompletion.js**, not rideController) |
| 4 | **authMiddleware.js** | `protect`: sets **req.user** |
| 5 | **rideCompletion.js** | `completeRide`: reads **req.body** only (rideId, riderId, driverId, distanceKm, ratings). Deletes **Ride** by rideId; creates **CompletedRide**; updates **User** greenPoints and ratings for rider and driver; optionally calls **safetyController.recordPositiveFeedback** for rider/driver if rating ≥ 4 |

**Hand-off:** Route passes `req` (with `req.user` from protect). **rideCompletion.completeRide** does not use `req.user`; it trusts `req.body.riderId` and `req.body.driverId`. So “who is completing” is not enforced server-side.

---

## 2. Files Involved and Hand-Offs

| File | Responsibility | Incoming | Outgoing / Side effects |
|------|----------------|----------|--------------------------|
| **server.js** | HTTP server, Socket.IO, MongoDB connection, route mounting | Incoming HTTP request | Mounts `/api/rides` → rideRoutes; `/api/auth` → authRoutes. Passes `req, res` to router. |
| **routes/ride.js** | Route matching and middleware chain | `req, res` from Express | For protected routes: calls `protect(req, res, next)` then controller. Passes same `req, res` to next in chain. **Key:** `protect` is in the middle of the chain; it calls `next()` only after setting `req.user`. |
| **utils/authMiddleware.js** | JWT verification and user resolution | `req.headers.authorization` | Verifies JWT with `process.env.JWT_SECRET`, loads user with **User.findById(decoded.id)**. **Sets `req.user`** (user doc). Calls `next()` or responds 401. |
| **controllers/rideController.js** | Create, search, match, join | `req.body`, `req.query`, `req.params`, **req.user** | **createRide:** uses `req.user._id` as driver, writes **Ride** model. **joinRide:** uses `req.params.rideId` and `req.user._id`, updates **Ride**. **searchRides / findMatches:** use **Ride** read-only. |
| **controllers/rideCompletion.js** | Complete ride and persist outcome | `req.body` (rideId, riderId, driverId, distanceKm, ratings) | Deletes **Ride**; creates **CompletedRide**; updates **User** (greenPoints, rating) for rider and driver; calls **safetyController.recordPositiveFeedback**. Does **not** use `req.user`. |
| **models/Ride.js** | Active ride document | — | Used by rideController (create, find, findById, save) and rideCompletion (findByIdAndDelete). |
| **models/CompletedRide.js** | Completed ride document | — | Used by rideCompletion.create and by **routes/ride.js** inline handler for `GET /history/:userId`. |
| **models/User.js** | User document | — | Used by authMiddleware (findById), rideCompletion (findById, update greenPoints/rating), safetyController (via recordPositiveFeedback). |
| **controllers/safetyController.js** | Safety settings and feedback | — | **recordPositiveFeedback(userId)** called by rideCompletion after completion; updates SafetySettings. |

### Critical hand-off: authMiddleware → controllers

- **Mechanism:** `protect` runs before the controller. It reads `Authorization: Bearer <token>`, verifies with `jwt.verify(token, process.env.JWT_SECRET)`, then `User.findById(decoded.id)` and assigns the result to **req.user**.
- **Passing “user_id”:** There is no separate `user_id` parameter. Controllers get the authenticated user via **req.user**; they use **req.user._id** when they need the current user (e.g. createRide driver, joinRide passenger).
- **Gap:** In **completeRide**, the handler does not use `req.user` at all. It relies on client-supplied `riderId` and `driverId` in `req.body`, so completion is not tied to the authenticated user and is vulnerable to misuse.

---

## 3. Single Point of Failure (SPOF)

### Primary SPOF: MongoDB

- **Where:** `server.js`: `mongoose.connect(process.env.MONGO_URI)` before `server.listen(...)`.
- **Effect:** If MongoDB is unreachable or fails, the app never starts (connect fails) or, if it were to connect later and then lose connection, every Ride/User/CompletedRide operation would fail.
- **Impact:** No ride creation, search, join, or completion; no auth (User lookup in protect fails). The whole ride lifecycle depends on this single DB.

**Mitigation (for interview):** Replica set, connection pooling, retry logic, and optionally a circuit breaker or fallback for non-critical paths. For true resilience, consider caching (e.g. session/user cache) so auth can degrade gracefully when DB is slow or down.

---

### Secondary: Non-atomic completion (data consistency)

- **Where:** **controllers/rideCompletion.js** `completeRide`.
- **Behavior:** Sequential steps: (1) delete Ride, (2) create CompletedRide, (3) update two Users (greenPoints, ratings), (4) optional recordPositiveFeedback. No transaction.
- **Failure mode:** If the process crashes or errors after deleting the Ride but before updating Users (or before creating CompletedRide), you get inconsistent state: active ride gone, but greenPoints/ratings not updated (or completed record missing).
- **Not a classic “single point of failure,” but a single critical path** that can leave the system in an inconsistent state.

**Mitigation:** Use a MongoDB transaction (session) that covers: delete Ride, create CompletedRide, update both Users (and optionally safety updates), and commit once. On any error, abort the transaction.

---

### Tertiary: Authorization gap on completion

- **Where:** **routes/ride.js** uses `protect` for `POST /complete`, but **rideCompletion.completeRide** ignores `req.user` and uses only `req.body.riderId` and `req.body.driverId`.
- **Risk:** Any authenticated user can complete any ride by sending a chosen rideId, riderId, and driverId (e.g. complete someone else’s ride or assign wrong people).
- **Mitigation:** In **completeRide**, enforce that `req.user._id` is either the driver or one of the passengers of the active ride (from **Ride** model), and derive riderId/driverId from the Ride document (or validate them against it) instead of trusting the body alone.

---

## 4. Summary Diagram (conceptual)

```
Client
  │
  ▼
server.js (mount /api/rides)
  │
  ▼
routes/ride.js (match POST /create | /:rideId/join | /complete | …)
  │
  ├─ protect (authMiddleware) ──► req.user = User doc
  │
  ▼
rideController (createRide, joinRide, searchRides, findMatches)
  │   uses req.user._id, Ride model
  │
  └─ for POST /complete only:
        rideCompletion.completeRide
          │   uses req.body only; does not use req.user
          │   Ride (delete) → CompletedRide (create) → User (update x2) → safetyController
          ▼
        Response
```

---

## 5. Quick reference: which controller is used where

| Route | Middleware | Controller (file) |
|-------|------------|-------------------|
| POST /api/rides/create | protect | rideController.createRide |
| GET /api/rides/search | protect | rideController.searchRides |
| POST /api/rides/match | none | rideController.findMatches |
| POST /api/rides/:rideId/join | protect | rideController.joinRide |
| POST /api/rides/complete | protect | **rideCompletion.completeRide** |
| GET /api/rides/history/:userId | protect | Inline in routes/ride.js (Ride + CompletedRide) |

Note: **rideController.js** also exports a `completeRide` and `getRideHistory`, but the route uses **rideCompletion.completeRide** and an inline history handler. So the “Ride Creation to Completion” completion step is implemented in **rideCompletion.js**.
