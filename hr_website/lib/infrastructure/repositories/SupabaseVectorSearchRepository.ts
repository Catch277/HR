import type { DocumentChunk } from "@/lib/domain/entities/ChatMessage";
import type { IVectorSearchRepository } from "@/lib/domain/repositories/IVectorSearchRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

/** Số lượng chunk tối đa lấy từ mỗi nguồn tìm kiếm. */
const MATCH_COUNT = 5;

/** Shape kết quả trả về từ RPC Supabase match_company_documents. */
interface RpcCompanyDocumentRow {
  content: string;
  document_name: string;
  similarity: number;
}

/** Shape kết quả trả về từ RPC Supabase match_user_contracts. */
interface RpcUserContractRow {
  content: string;
  contract_title: string;
  similarity: number;
}

/**
 * Triển khai IVectorSearchRepository, gọi các hàm RPC của Supabase
 * (`match_company_documents` và `match_user_contracts`) để tìm kiếm
 * các đoạn tài liệu gần nhất dựa trên vector embedding.
 */
export class SupabaseVectorSearchRepository
  implements IVectorSearchRepository
{
  async matchCompanyDocuments(
    embedding: number[],
    matchCount: number = MATCH_COUNT,
  ): Promise<DocumentChunk[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("match_company_documents", {
      query_embedding: embedding,
      match_count: matchCount,
    });

    if (error) {
      throw new Error(
        `match_company_documents RPC failed: ${error.message}`,
      );
    }

    const rows = (data ?? []) as RpcCompanyDocumentRow[];

    return rows.map((row) => ({
      content: row.content,
      source: row.document_name,
      similarity: row.similarity,
    }));
  }

  async matchUserContracts(
    embedding: number[],
    userId: string,
    matchCount: number = MATCH_COUNT,
  ): Promise<DocumentChunk[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("match_user_contracts", {
      query_embedding: embedding,
      query_user_id: userId,
      match_count: matchCount,
    });

    if (error) {
      throw new Error(`match_user_contracts RPC failed: ${error.message}`);
    }

    const rows = (data ?? []) as RpcUserContractRow[];

    return rows.map((row) => ({
      content: row.content,
      source: row.contract_title,
      similarity: row.similarity,
    }));
  }
}
