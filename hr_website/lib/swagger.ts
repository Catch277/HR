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
        },
      },
    },
  });
}
