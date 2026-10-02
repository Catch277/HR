"use client";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Check,
  Copy,
  FileText,
  History,
  Loader2,
  Mic,
  Paperclip,
  PlusCircle,
  RotateCw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  steps?: string[];
  confidence?: string;
  source?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Cho mình hỏi quy định về việc nhân viên giải trình khi két tiền ca làm việc bị hụt trên 100.000 đồng thì xử lý như thế nào?",
      sender: "user",
    },
    {
      id: 2,
      text: "Theo quy chế Quản lý Quỹ tiền mặt & Doanh thu ca làm việc, trường hợp thiếu hụt từ 100.000 đồng trở lên cần xử lý theo 3 bước sau:",
      sender: "ai",
      confidence: "99,4%",
      source: "Quy chế Tài chính & Chốt ca bán hàng · Mục 4.2",
      steps: [
        "Lập biên bản kiểm quỹ ngay tại thời điểm chốt ca. Bắt buộc kích hoạt mẫu phiếu kiểm kê tiền mặt trên hệ thống POS.",
        "Ký xác nhận 2 bên. Người bàn giao và người nhận ca cùng ký xác nhận trên biên bản và đính kèm tài liệu trước khi bàn giao.",
        "Nhập giải trình chi tiết vào hệ thống trong vòng 2 giờ kể từ khi hết ca. Nếu chênh lệch do lỗi kết nối POS hoặc sai sót kỹ thuật máy QR, đội Kỹ thuật & Kế toán sẽ hỗ trợ đối soát bù trừ trong ngày.",
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    // Mock API call to POST /api/chat/ask
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        text: "Dựa trên dữ liệu và tài liệu nội bộ hiện có, đây là hướng xử lý phù hợp:",
        sender: "ai",
        confidence: "97,8%",
        source: "Sổ tay Nhân sự Humora · Quy trình vận hành",
        steps: [
          "Kiểm tra thông tin yêu cầu và dữ liệu ca làm liên quan.",
          "Đối chiếu với quy định đang áp dụng tại chi nhánh.",
          "Ghi nhận kết quả vào hồ sơ và liên hệ quản lý trực tiếp nếu cần xác minh thêm.",
        ],
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0C66E4] text-white">
            <Bot size={18} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900">
                Trợ lý Nhân sự & Vận hành Humora
              </h1>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                v2.4 Active
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              Hỗ trợ đối soát, tra cứu quy chế và giải quyết tác vụ thường ngày.
            </p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg bg-[#F3F6FC] p-1 text-[10px] font-medium text-slate-500">
          <button className="rounded-md bg-white px-3 py-1.5 text-[#0C66E4] shadow-sm">
            <Sparkles size={12} className="mr-1 inline" />
            Copilot toàn quyền
          </button>
          <button className="rounded-md px-3 py-1.5 hover:text-slate-800">
            <BookOpen size={12} className="mr-1 inline" />
            Sổ tay số
          </button>
          <button className="rounded-md px-3 py-1.5 hover:text-slate-800">
            Truy vấn ERP
          </button>
        </div>
      </div>

      <div className="grid min-h-[calc(100dvh-190px)] grid-cols-1 gap-4 lg:grid-cols-[228px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <button
            onClick={() =>
              setMessages([
                {
                  id: Date.now(),
                  text: "Xin chào! Tôi có thể giúp gì cho bạn hôm nay?",
                  sender: "ai",
                },
              ])
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-[#0C66E4] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <PlusCircle size={15} /> Cuộc trò chuyện mới
          </button>
          <section>
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Hội thoại gần đây
              </h2>
              <History size={13} className="text-slate-400" />
            </div>
            <div className="space-y-1">
              <button className="w-full rounded-lg bg-blue-50 px-2.5 py-2 text-left text-[10px] font-semibold leading-relaxed text-slate-800">
                <span className="flex items-start gap-2">
                  <FileText
                    size={13}
                    className="mt-0.5 shrink-0 text-[#0C66E4]"
                  />
                  Quy trình giải trình lệch quỹ
                </span>
                <span className="ml-5 mt-1 block text-[9px] font-normal text-slate-500">
                  Hôm nay · 4 phút trước
                </span>
              </button>
              <button className="w-full rounded-lg px-2.5 py-2 text-left text-[10px] leading-relaxed text-slate-600 transition-colors hover:bg-slate-50">
                <span className="flex items-start gap-2">
                  <FileText
                    size={13}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  Quy định nghỉ phép năm
                </span>
                <span className="ml-5 mt-1 block text-[9px] text-slate-400">
                  Hôm qua · 12 câu hỏi
                </span>
              </button>
              <button className="w-full rounded-lg px-2.5 py-2 text-left text-[10px] leading-relaxed text-slate-600 transition-colors hover:bg-slate-50">
                <span className="flex items-start gap-2">
                  <FileText
                    size={13}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  Hướng dẫn tính KPI doanh thu
                </span>
                <span className="ml-5 mt-1 block text-[9px] text-slate-400">
                  14/10/2026 · 8 tài liệu
                </span>
              </button>
              <button className="w-full rounded-lg px-2.5 py-2 text-left text-[10px] leading-relaxed text-slate-600 transition-colors hover:bg-slate-50">
                <span className="flex items-start gap-2">
                  <FileText
                    size={13}
                    className="mt-0.5 shrink-0 text-slate-400"
                  />
                  Chính sách phụ cấp ca tối
                </span>
                <span className="ml-5 mt-1 block text-[9px] text-slate-400">
                  11/10/2026 · Đã lưu
                </span>
              </button>
            </div>
          </section>
          <section className="border-t border-slate-100 pt-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Gợi ý tác vụ nhanh
              </h2>
              <Sparkles size={13} className="text-[#0C66E4]" />
            </div>
            <div className="space-y-2">
              <button
                onClick={() =>
                  setInputMessage("Kiểm tra chênh lệch doanh thu tuần này")
                }
                className="w-full rounded-lg border border-blue-100 bg-blue-50/70 p-2.5 text-left transition-colors hover:bg-blue-50"
              >
                <span className="flex items-center justify-between text-[10px] font-semibold text-[#0C66E4]">
                  <span>
                    <WalletCards size={12} className="mr-1 inline" />
                    Đối soát tài chính
                  </span>
                  <ArrowUpRight size={12} />
                </span>
                <span className="mt-1.5 block text-[9px] leading-relaxed text-slate-600">
                  Kiểm tra chênh lệch doanh thu tuần này
                </span>
              </button>
              <button
                onClick={() =>
                  setInputMessage("Tóm tắt các đơn xin nghỉ đang chờ duyệt")
                }
                className="w-full rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 text-left transition-colors hover:bg-emerald-50"
              >
                <span className="flex items-center justify-between text-[10px] font-semibold text-emerald-700">
                  <span>
                    <BriefcaseBusiness size={12} className="mr-1 inline" />
                    Đơn từ nhân sự
                  </span>
                  <ArrowUpRight size={12} />
                </span>
                <span className="mt-1.5 block text-[9px] leading-relaxed text-slate-600">
                  Tóm tắt các đơn xin nghỉ đang chờ duyệt
                </span>
              </button>
              <button
                onClick={() =>
                  setInputMessage("Tóm tắt các chính sách lương và chế độ mới")
                }
                className="w-full rounded-lg border border-amber-100 bg-amber-50/50 p-2.5 text-left transition-colors hover:bg-amber-50"
              >
                <span className="flex items-center justify-between text-[10px] font-semibold text-amber-800">
                  <span>
                    <Activity size={12} className="mr-1 inline" />
                    Lương & chế độ
                  </span>
                  <ArrowUpRight size={12} />
                </span>
                <span className="mt-1.5 block text-[9px] leading-relaxed text-slate-600">
                  Tra cứu quyền lợi và chính sách nội bộ
                </span>
              </button>
            </div>
          </section>
          <div className="mt-auto flex items-center gap-2 rounded-lg bg-[#F3F6FC] px-2.5 py-2 text-[9px] text-slate-500">
            <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
            Phiên làm việc bảo mật · Ca 1 (08:00–17:30)
          </div>
        </aside>

        <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                <Sparkles size={16} />
              </span>
              <div>
                <h2 className="text-xs font-bold text-slate-900">
                  Humora Copilot AI
                </h2>
                <p className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{" "}
                  Sẵn sàng hỗ trợ · Dữ liệu ERP đồng bộ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="Sao chép hội thoại"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <Copy size={14} />
              </button>
              <button
                title="Tạo câu trả lời mới"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <RotateCw size={14} />
              </button>
              <button
                title="Cài đặt trợ lý"
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <Settings2 size={14} />
              </button>
            </div>
          </header>
          <div className="flex-1 space-y-6 overflow-y-auto bg-[#FBFCFF] p-4 sm:p-6">
            <div className="mx-auto w-fit rounded-full bg-blue-50 px-3 py-1.5 text-[9px] font-medium text-slate-600">
              <ShieldCheck size={11} className="mr-1 inline text-[#0C66E4]" />
              Phiên làm việc bảo mật · Ca 1 (08:00–17:30) · Q.1 - TP. Hồ Chí
              Minh
            </div>
            {messages.map((msg) =>
              msg.sender === "user" ? (
                <div
                  key={msg.id}
                  className="ml-auto flex max-w-[88%] items-start justify-end gap-2.5"
                >
                  <div className="rounded-xl rounded-tr-sm bg-[#0C66E4] px-4 py-3 text-xs leading-relaxed text-white shadow-sm">
                    {msg.text}
                    <p className="mt-2 text-right text-[9px] text-blue-100">
                      09:24 AM · ✓✓
                    </p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#0C66E4]">
                    <UserRound size={14} />
                  </span>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0C66E4] text-white">
                    <Bot size={15} />
                  </span>
                  <article className="max-w-[94%] space-y-3 rounded-xl rounded-tl-sm border border-slate-200/70 bg-white p-4 shadow-sm sm:max-w-[88%]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#0C66E4]">
                        <BookOpen size={12} />
                        {msg.source ?? "Sổ tay Nhân sự Humora"}
                      </span>
                      {msg.confidence && (
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-semibold text-slate-600">
                          Độ tin cậy:{" "}
                          <b className="text-[#0C66E4]">{msg.confidence}</b>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-700">
                      {msg.text}
                    </p>
                    {msg.steps && (
                      <ol className="space-y-2">
                        {msg.steps.map((step, index) => (
                          <li
                            key={step}
                            className="flex gap-2.5 rounded-lg border border-slate-100 bg-[#FBFCFF] p-3"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[9px] font-bold text-[#0C66E4]">
                              {index + 1}
                            </span>
                            <span className="text-[10px] leading-relaxed text-slate-700">
                              {step}
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[9px] font-medium text-[#0C66E4]">
                        <FileText size={11} />
                        {msg.source?.split(" · ")[0] ??
                          "Tài liệu nội bộ Humora"}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        Trích dẫn · Đã xác minh nội bộ
                      </span>
                    </div>
                  </article>
                </div>
              ),
            )}
            {isLoading && (
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#0C66E4]">
                  <Sparkles size={15} />
                </span>
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-[10px] text-slate-500">
                  <Loader2 size={13} className="animate-spin text-[#0C66E4]" />
                  Đang phân tích dữ liệu...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-slate-100 bg-white p-3 sm:px-4">
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-slate-200 bg-[#F8F9FF] p-2 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500/10"
            >
              <textarea
                rows={2}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi trợ lý AI về quy chế công ty, thủ tục đơn từ, hoặc tra cứu doanh thu..."
                className="w-full resize-none bg-transparent px-2 py-1.5 text-xs leading-relaxed outline-none placeholder:text-slate-400"
                disabled={isLoading}
              />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1">
                  <label
                    title="Đính kèm tài liệu"
                    className="cursor-pointer rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-[#0C66E4]"
                  >
                    <Paperclip size={14} />
                    <input type="file" className="sr-only" />
                  </label>
                  <button
                    type="button"
                    title="Thu âm"
                    className="rounded-md p-1.5 text-slate-500 hover:bg-white hover:text-[#0C66E4]"
                  >
                    <Mic size={14} />
                  </button>
                  <span className="ml-1 text-[9px] text-slate-400">
                    Enter để gửi · Shift + Enter xuống dòng
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  title="Gửi tin nhắn"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0C66E4] text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
            <p className="mt-2 text-center text-[9px] text-slate-400">
              <Check size={10} className="mr-1 inline text-emerald-600" />
              Humora AI chỉ có thể truy cập dữ liệu nhân sự nội bộ và sổ tay
              công ty.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
