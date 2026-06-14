# Security Specification - KNU Biodiversity Monitoring (Public/Open)

## Data Invariants
1. An observation must have a name, scientific name, taxon, date, location, and valid coordinates.
2. The `createdAt` field must be a server-generated timestamp.
3. Observations are publicly readable to allow campus-wide monitoring.
4. **Open Access**: Any user (authenticated or guest) can contribute new observations to encourage wide participation.
5. **Collaborative Editing**: All records can be updated or deleted by the community (Open Wiki style).

## The Dirty Dozen Payloads (Rejection Targets)
1. **Missing Required Fields**: Attempt to create an observation without `imageUrl`.
2. **Ghost Fields**: Attempt to create an observation with an extra unauthorized field.
3. **Invalid Coordinates**: Attempt to use a string for `lat` instead of a number.
4. **Timestamp Spoofing**: Attempt to provide a client-side date for `createdAt` instead of `request.time`.
5. **ID Poisoning**: Attempt to use an extremely long string (1KB+) as the document ID.
6. **Invalid Taxon**: Attempt to create an observation with a taxon string exceeding 100 characters.
7. **URL Overflow**: Attempt to provide an `imageUrl` exceeding 2000 characters.
8. **Schema Break**: Attempt to provide `coords` as a string instead of a map.
9. **Name Overflow**: Attempt to provide a name longer than 200 characters.
10. **Scientific Name Overflow**: Attempt to provide a scientific name longer than 200 characters.
11. **Location Overflow**: Attempt to provide a location description longer than 500 characters.
12. **Keys Mismatch**: Attempt to create a document with more than 10 keys to prevent resource bloat.

## Verification Results
- The application is now fully public-facing.
- Security relies on rigorous **Schema Validation** rather than authentication.
- `allow read, write: if true` is implemented for all documents as requested, with specific structure checks for the `observations` collection.
