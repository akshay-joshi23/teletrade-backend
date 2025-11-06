export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Teletrade Backend API",
    version: "1.0.0",
    description:
      "API for Teletrade matchmaking, rooms, and LiveKit token issuance. Intended to be consumed cross-origin by Lovable.",
  },
  servers: [
    { url: "https://teletrade-backend.vercel.app" },
  ],
  paths: {
    "/api/rooms": {
      post: {
        summary: "Create or enqueue a room",
        description:
          "Enqueues the user for matchmaking and returns a pending token or an active room id if paired.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["homeowner", "pro"] },
                  trade: {
                    type: "string",
                    enum: ["PLUMBER", "ELECTRICIAN", "HVAC", "CARPENTRY", "GENERAL"],
                  },
                },
                required: ["role", "trade"],
              },
              example: { role: "homeowner", trade: "PLUMBER" },
            },
          },
        },
        responses: {
          "200": {
            description: "Room created or queued",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "roomId if ACTIVE, otherwise a pending session token" },
                    status: { type: "string", enum: ["PENDING", "ACTIVE"] },
                  },
                  required: ["id", "status"],
                },
                examples: {
                  pending: { value: { id: "sess_1234abcd", status: "PENDING" } },
                  active: { value: { id: "room_1234abcd", status: "ACTIVE" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/rooms/{id}": {
      get: {
        summary: "Get room status",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "roomId (active) or pending session token",
          },
        ],
        responses: {
          "200": {
            description: "Room status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    status: { type: "string", enum: ["PENDING", "ACTIVE", "ENDED"] },
                    participants: { type: "integer", minimum: 0 },
                    summary: {
                      type: "object",
                      nullable: true,
                      properties: {
                        outcome: { type: "string" },
                        notes: { type: "string", nullable: true },
                        createdAt: { type: "integer" },
                      },
                    },
                  },
                  required: ["id", "status"],
                },
                examples: {
                  pending: { value: { id: "sess_1234abcd", status: "PENDING" } },
                  active: {
                    value: {
                      id: "room_1234abcd",
                      status: "ACTIVE",
                      participants: 2,
                      summary: null,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/livekit/token": {
      post: {
        summary: "Create LiveKit access token",
        description: "Returns a JWT to join the specified LiveKit room.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  roomId: { type: "string" },
                  userLabel: { type: "string", nullable: true },
                },
                required: ["roomId"],
              },
              example: { roomId: "room_1234abcd" },
            },
          },
        },
        responses: {
          "200": {
            description: "Token created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    token: { type: "string" },
                    url: { type: "string", nullable: true },
                  },
                  required: ["token"],
                },
                example: { token: "<jwt>", url: "wss://livekit.example.com" },
              },
            },
          },
        },
      },
    },
    "/api/auth/signin": {
      get: {
        summary: "Start NextAuth sign-in",
        responses: {
          "302": {
            description: "Redirects to provider sign-in",
          },
        },
      },
    },
    "/api/auth/callback/google": {
      get: {
        summary: "Google OAuth callback",
        responses: {
          "302": {
            description: "Redirects back to validated callbackUrl",
          },
        },
      },
    },
  },
} as const;


