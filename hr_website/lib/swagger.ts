import { createSwaggerSpec } from "next-swagger-doc";

export function getApiDocs() {
  return createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "HR Website API",
        version: "1.0.0",
        description: "API documentation for the HR Website backend.",
      },
      components: {
        schemas: {
          User: {
            type: "object",
            required: ["id", "full_name", "role"],
            properties: {
              id: { type: "string", format: "uuid" },
              full_name: { type: "string" },
              role: { type: "string" },
            },
          },
          RevenueRecord: {
            type: "object",
            required: [
              "id",
              "branch_id",
              "open_amount",
              "created_at",
              "created_by",
              "close_amount",
              "close_note",
              "close_image_url",
              "closed_by",
              "closed_at",
              "audit_log",
            ],
            properties: {
              id: { type: "string", format: "uuid" },
              branch_id: { type: "string", format: "uuid" },
              open_amount: { type: "number", minimum: 0 },
              created_at: { type: "string", format: "date-time" },
              created_by: { type: "string", format: "uuid" },
              close_amount: { type: "number", minimum: 0, nullable: true },
              close_note: { type: "string", nullable: true },
              close_image_url: { type: "string", nullable: true },
              closed_by: { type: "string", format: "uuid", nullable: true },
              closed_at: { type: "string", format: "date-time", nullable: true },
              audit_log: { type: "array", items: {} },
            },
          },
        },
      },
    },
  });
}
