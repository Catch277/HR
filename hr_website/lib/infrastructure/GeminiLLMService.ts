import {
  GoogleGenerativeAI,
  type GenerateContentResult,
} from "@google/generative-ai";

import type { DocumentChunk } from "@/lib/domain/entities/ChatMessage";
import type { ILLMService } from "@/lib/domain/repositories/ILLMService";

/** Model dùng để tạo embedding. */
const EMBEDDING_MODEL = "text-embedding-004";

/** Model dùng để sinh câu trả lời. */
const CHAT_MODEL = "gemini-1.5-flash";

/**
 * Câu trả lời mặc định khi ngữ cảnh không chứa thông tin liên quan.
 * Được LLM trả về theo đúng quy tắc Prompt.
 */
const NO_INFO_RESPONSE =
  "Tôi không có thông tin về vấn đề này. Vui lòng liên hệ quản lý để được hỗ trợ.";

/**
 * Triển khai ILLMService sử dụng Google Gemini API.
 * - Embedding: model `text-embedding-004`
 * - Chat completion: model `gemini-1.5-flash`
 */
export class GeminiLLMService implements ILLMService {
  private readonly client: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  /** Tạo vector embedding cho một đoạn văn bản. */
  async createEmbedding(text: string): Promise<number[]> {
    const model = this.client.getGenerativeModel({ model: EMBEDDING_MODEL });

    const result = await model.embedContent(text);

    return result.embedding.values;
  }

  /** Sinh câu trả lời từ LLM dựa trên câu hỏi và ngữ cảnh tài liệu. */
  async chat(question: string, context: DocumentChunk[]): Promise<string> {
    const model = this.client.getGenerativeModel({ model: CHAT_MODEL });

    const contextBlock =
      context.length === 0
        ? "(Không có tài liệu liên quan nào được tìm thấy.)"
        : context
            .map(
              (chunk, idx) =>
                `[Nguồn ${idx + 1}: ${chunk.source}]\n${chunk.content}`,
            )
            .join("\n\n---\n\n");

    const prompt = `Bạn là trợ lý HR thông minh. Nhiệm vụ của bạn là trả lời câu hỏi của nhân viên dựa trên các tài liệu nội bộ được cung cấp bên dưới.

QUY TẮC BẮT BUỘC:
1. Chỉ trả lời dựa trên nội dung trong phần NGỮ CẢNH bên dưới.
2. Khi trích dẫn thông tin, hãy ghi rõ nguồn (ví dụ: "Theo [Nguồn 1: Tên tài liệu]...").
3. Nếu ngữ cảnh KHÔNG chứa đủ thông tin để trả lời, hãy trả lời CHÍNH XÁC câu sau và không thêm bất kỳ thông tin nào khác: "${NO_INFO_RESPONSE}"
4. Tuyệt đối không bịa đặt, suy diễn hay thêm thông tin ngoài ngữ cảnh.

NGỮ CẢNH TÀI LIỆU:
${contextBlock}

CÂU HỎI CỦA NHÂN VIÊN:
${question}

TRẢ LỜI:`;

    const result: GenerateContentResult = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text.trim();
  }
}
