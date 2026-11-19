# Firestore Security Specification

## 1. Data Invariants
1. `shopSettings/main` holds public store details (`name`, `address`, `phone`, `email`, hours, hero copy, single-origin spotlight). Only verified shop admins can write to `shopSettings/{settingId}`.
2. `menuItems/{itemId}` holds menu entries. Only available items (`isAvailable == true`) are queryable by public visitors; admins can list, create, update, and delete all menu items. Every write enforces strict schema keys, bounded strings, valid categories, bounded price (`0..500`), and server-verified `updatedAt == request.time`.
3. `contactMessages/{messageId}` holds visitor PII (`name`, `email`, `message`). Anyone may create a message ONLY if `status == 'new'`, `createdAt == request.time`, email matches regex, and no shadow fields exist. Reading, listing, updating `status`, or deleting `contactMessages` is strictly restricted to verified admins (`isAdmin()`).
4. `admins/{adminId}` is read-only for the owning admin and cannot be modified by clients.

## 2. Adversarial Payloads ("Dirty Dozen")
1. **Shadow field on contactMessage**: `{ ..., "isAdmin": true }` -> Rejected by `keys().hasOnly(...)`.
2. **Status shortcut on contactMessage create**: `{ ..., "status": "replied" }` -> Rejected because `data.status == 'new'` is enforced on create.
3. **Spoofed timestamp on contactMessage**: `{ ..., "createdAt": "2020-01-01T00:00:00Z" }` -> Rejected by `createdAt == request.time`.
4. **Oversized message payload (DoW)**: `message` > 2000 chars -> Rejected by `size() <= 2000`.
5. **Invalid email format**: `email: "not-an-email"` -> Rejected by regex match.
6. **Public read/list of contactMessages (PII leak)**: Unauthenticated or non-admin `get`/`list` on `/contactMessages` -> Rejected by `isAdmin()`.
7. **Unverified admin email spoof**: Auth token has `email == 'iam.harshuljain@gmail.com'` with `email_verified == false` -> Rejected by `request.auth.token.email_verified == true`.
8. **Mutating visitor message text on admin status update**: Admin attempts to alter `message` or `email` -> Rejected by immutability checks and `affectedKeys().hasOnly(['status', 'updatedAt'])`.
9. **ID poisoning**: Document ID containing `/` or >128 chars or special characters -> Rejected by `isValidId()`.
10. **Non-admin menu item write**: Signed-in non-admin attempts `create`/`update`/`delete` on `/menuItems/{id}` -> Rejected by `isAdmin()`.
11. **Negative or astronomical price**: `price: -5` or `price: 99999` -> Rejected by `price >= 0 && price <= 500`.
12. **Arbitrary temperatures array injection**: `temperatures: ["Hot", "FrozenLava"]` -> Rejected by `temperatures.hasOnly(['Hot', 'Iced'])`.
