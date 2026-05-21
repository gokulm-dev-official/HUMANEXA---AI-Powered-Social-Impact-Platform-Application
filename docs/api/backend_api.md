# Backend API Reference

The Node.js Express backend exposes several RESTful endpoints for the frontend application.

## Authentication
Base Path: `/api/auth`

* `POST /register` - Register a new user (Donor, Helper, Admin).
* `POST /login` - Authenticate and receive JWT.
* `POST /refresh` - Refresh access token.

## Escrow & Donations
Base Path: `/api/escrow`

* `POST /initiate` - Lock funds in escrow for a specific need.
* `POST /release` - Release funds from escrow to the helper upon AI verification.
* `GET /logs/:userId` - Retrieve immutable Sincerity Logs for a user.

## Certificates
Base Path: `/api/certificates`

* `GET /:userId` - Retrieve the current Sincerity Tier and Impact Points for a user.
* `GET /verify/:hash` - Verify the authenticity of a generated certificate via its blockchain hash.
