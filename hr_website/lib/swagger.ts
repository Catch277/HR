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
          RequestEntity: {
            type: "object",
            required: [
              "id",
              "branch_id",
              "request_type",
              "status",
              "reject_reason",
              "approver_id",
              "created_at",
              "updated_at",
            ],
            properties: {
              id: { type: "string", format: "uuid" },
              branch_id: { type: "string", format: "uuid" },
              request_type: { type: "string" },
              status: { type: "string" },
              reject_reason: { type: "string", nullable: true },
              approver_id: { type: "string", format: "uuid", nullable: true },
              created_at: { type: "string", format: "date-time" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          RevenueReport: {
            type: "object",
            required: ["period", "date", "range", "summary", "comparison", "series"],
            properties: {
              period: {
                type: "string",
                enum: ["day", "week", "month", "quarter", "year"],
              },
              date: { type: "string", format: "date" },
              range: {
                type: "object",
                required: ["start_at", "end_at"],
                properties: {
                  start_at: { type: "string", format: "date-time" },
                  end_at: { type: "string", format: "date-time" },
                },
              },
              summary: { $ref: "#/components/schemas/RevenueReportSummary" },
              comparison: {
                type: "object",
                required: [
                  "previous_total_revenue_amount",
                  "difference",
                  "percentage_change",
                ],
                properties: {
                  previous_total_revenue_amount: { type: "number" },
                  difference: { type: "number" },
                  percentage_change: { type: "number", nullable: true },
                },
              },
              series: {
                type: "array",
                items: { $ref: "#/components/schemas/RevenueReportPoint" },
              },
            },
          },
          RevenueReportSummary: {
            type: "object",
            required: [
              "total_open_amount",
              "total_close_amount",
              "total_revenue_amount",
              "record_count",
            ],
            properties: {
              total_open_amount: { type: "number" },
              total_close_amount: { type: "number" },
              total_revenue_amount: { type: "number" },
              record_count: { type: "integer" },
            },
          },
          RevenueReportPoint: {
            type: "object",
            required: [
              "bucket_start",
              "total_open_amount",
              "total_close_amount",
              "total_revenue_amount",
              "record_count",
            ],
            properties: {
              bucket_start: { type: "string", format: "date-time" },
              total_open_amount: { type: "number" },
              total_close_amount: { type: "number" },
              total_revenue_amount: { type: "number" },
              record_count: { type: "integer" },
            },
          },
          QuickSearchResult: {
            type: "object",
            required: ["query", "type", "total", "users", "requests", "shifts"],
            properties: {
              query: { type: "string" },
              type: { type: "string", enum: ["all", "users", "requests", "shifts"] },
              total: { type: "integer" },
              users: {
                type: "array",
                items: { $ref: "#/components/schemas/QuickSearchUser" },
              },
              requests: {
                type: "array",
                items: { $ref: "#/components/schemas/QuickSearchRequest" },
              },
              shifts: {
                type: "array",
                items: { $ref: "#/components/schemas/QuickSearchShift" },
              },
            },
          },
          QuickSearchUser: {
            type: "object",
            required: ["id", "full_name", "role"],
            properties: {
              id: { type: "string", format: "uuid" },
              full_name: { type: "string" },
              role: { type: "string" },
            },
          },
          QuickSearchRequest: {
            type: "object",
            required: ["id", "branch_id", "request_type", "status", "updated_at"],
            properties: {
              id: { type: "string", format: "uuid" },
              branch_id: { type: "string", format: "uuid" },
              request_type: { type: "string" },
              status: { type: "string" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          QuickSearchShift: {
            type: "object",
            required: ["id", "name", "branch_id", "start_time", "end_time"],
            properties: {
              id: { type: "string", format: "uuid" },
              name: { type: "string" },
              branch_id: { type: "string", format: "uuid" },
              start_time: { type: "string", nullable: true },
              end_time: { type: "string", nullable: true },
            },
          },
          Notification: {
            type: "object",
            required: [
              "id",
              "user_id",
              "title",
              "body",
              "type",
              "is_read",
              "related_entity_type",
              "related_entity_id",
              "created_at",
            ],
            properties: {
              id: { type: "string", format: "uuid" },
              user_id: { type: "string", format: "uuid" },
              title: { type: "string" },
              body: { type: "string" },
              type: { type: "string", description: "Notification type (e.g. request_approved, shift_changed)." },
              is_read: { type: "boolean" },
              related_entity_type: { type: "string", nullable: true },
              related_entity_id: { type: "string", format: "uuid", nullable: true },
              created_at: { type: "string", format: "date-time" },
            },
          },
          PaginatedNotifications: {
            type: "object",
            required: ["data", "total", "page", "page_size"],
            properties: {
              data: {
                type: "array",
                items: { $ref: "#/components/schemas/Notification" },
              },
              total: { type: "integer", description: "Total number of notifications." },
              page: { type: "integer", description: "Current page number." },
              page_size: { type: "integer", description: "Number of items per page." },
            },
          },
          NotificationSetting: {
            type: "object",
            required: ["id", "user_id", "channel", "enabled", "updated_at"],
            properties: {
              id: { type: "string", format: "uuid" },
              user_id: { type: "string", format: "uuid" },
              channel: { type: "string", description: "Notification channel (e.g. email, push, in_app)." },
              enabled: { type: "boolean" },
              updated_at: { type: "string", format: "date-time" },
            },
          },
          ChatAskRequest: {
            type: "object",
            required: ["question"],
            properties: {
              question: {
                type: "string",
                minLength: 1,
                description: "Câu hỏi của nhân viên về chính sách, quy định hoặc hợp đồng.",
                example: "Chính sách nghỉ phép năm của công ty là bao nhiêu ngày?",
              },
            },
          },
          DocumentChunk: {
            type: "object",
            required: ["content", "source", "similarity"],
            properties: {
              content: {
                type: "string",
                description: "Nội dung đoạn tài liệu được tìm thấy.",
              },
              source: {
                type: "string",
                description: "Tên / tiêu đề tài liệu nguồn (dùng để trích dẫn).",
              },
              similarity: {
                type: "number",
                format: "float",
                minimum: 0,
                maximum: 1,
                description: "Điểm tương đồng cosine với câu hỏi [0, 1].",
              },
            },
          },
          ChatAskResponse: {
            type: "object",
            required: ["answer", "sources"],
            properties: {
              answer: {
                type: "string",
                description: "Câu trả lời được sinh bởi Gemini dựa trên ngữ cảnh tài liệu.",
                example: "Theo [Nguồn 1: Nội quy công ty], nhân viên được nghỉ phép 12 ngày mỗi năm.",
              },
              sources: {
                type: "array",
                description: "Danh sách các đoạn tài liệu được dùng làm ngữ cảnh, sắp xếp theo độ tương đồng giảm dần.",
                items: {
                  $ref: "#/components/schemas/DocumentChunk",
                },
              },
            },
          },
          ErrorResponse: {
            type: "object",
            required: ["error"],
            properties: {
              error: {
                type: "string",
                description: "Mô tả lỗi.",
                example: "Trường `question` là bắt buộc và phải là chuỗi không rỗng.",
              },
            },
          },
        },
      },
    },
  });
}
