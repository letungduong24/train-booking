"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Bot, User, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TripSearchResult } from "@/features/chatbot/components/trip-search-result";
import { BookingHistoryResult } from "@/features/chatbot/components/booking-history-result";
import ReactMarkdown from "react-markdown";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";

// Bouncing dots loading indicator
function BouncingDots({ label }: { label?: string }) {
    return (
        <div className="self-start flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
            <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                    <span key={i} className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }} />
                ))}
            </div>
            {label && <span>{label}</span>}
        </div>
    );
}

const SUGGESTIONS = [
    'Tôi muốn đặt vé',
    'Xem vé đã đặt của tôi',
    'Số dư ví của tôi',
    'Các tuyến đường có sẵn',
    'Loại hành khách và giảm giá',
];

function SuggestionChips({ onSelect, disabled }: { onSelect: (text: string) => void; disabled?: boolean }) {
    return (
        <div className="flex flex-wrap gap-1.5 px-1">
            {SUGGESTIONS.map((text) => (
                <button
                    key={text}
                    onClick={() => onSelect(text)}
                    disabled={disabled}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground hover:bg-muted hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {text}
                </button>
            ))}
        </div>
    );
}

export function GlobalChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const { messages, sendMessage, status } =
        useChat({
            transport: new DefaultChatTransport({
                api: process.env.NEXT_PUBLIC_API_URL + "/api/chat",
                credentials: 'include',
            }),
            onError: (error) => {
                console.error("Chat error:", error);
            },
        });

    const isLoading = status === "submitted" || status === "streaming";

    const handleSend = (text: string) => {
        if (!text.trim() || isLoading) return;
        sendMessage({ text });
        setInput("");
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" showCloseButton={false} className="w-full sm:w-[450px] sm:max-w-md p-0 flex flex-col h-[100dvh]">
                    <SheetHeader className="relative bg-primary text-primary-foreground p-4 shrink-0 shadow-sm border-b-none">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            <SheetTitle className="text-primary-foreground text-left text-base font-semibold">Trợ lý ảo</SheetTitle>
                        </div>
                        <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-primary-foreground/10 text-primary-foreground">
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </SheetClose>
                    </SheetHeader>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground gap-4">
                            <Bot className="h-10 w-10 opacity-20" />
                            <div>
                                <p className="text-sm font-medium">Xin chào! Tôi có thể giúp gì cho bạn?</p>
                                <p className="text-xs mt-1 opacity-70">Chọn một gợi ý hoặc tự nhập câu hỏi</p>
                            </div>
                            <SuggestionChips onSelect={handleSend} disabled={isLoading} />
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className="flex flex-col gap-2">
                                {m.parts?.map((part, index) => {
                                    switch (part.type) {
                                        // ── Text ──────────────────────────────────────────────
                                        case 'text': {
                                            if (!part.text.trim()) return null;
                                            // Hide text if message already has a rendered tool output
                                            const hasToolOutput = m.parts?.some(
                                                (p) => [
                                                    'tool-searchTrainTrips',
                                                    'tool-getMyBookings',
                                                    'tool-getWalletBalance',
                                                    'tool-getPassengerGroups',
                                                    'tool-getRoutes',
                                                ].includes(p.type) && (p as any).state === 'output-available'
                                            );
                                            if (hasToolOutput) return null;
                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "flex max-w-[85%] flex-col gap-1 text-sm rounded-xl px-4 py-2",
                                                        m.role === "user"
                                                            ? "self-end bg-primary text-primary-foreground rounded-tr-sm"
                                                            : "self-start bg-muted rounded-tl-sm",
                                                    )}
                                                >
                                                    <div className="flex items-center gap-1.5 opacity-70 mb-1">
                                                        {m.role === "user" ? (
                                                            <>
                                                                <span className="text-xs">Bạn</span>
                                                                <User className="h-3 w-3" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bot className="h-3 w-3" />
                                                                <span className="text-xs">Trợ lý</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="text-sm break-words leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-0.5 prose-ul:my-0.5 prose-li:my-0">
                                                        {m.role === "user" ? part.text : <ReactMarkdown>{part.text}</ReactMarkdown>}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // ── findStationByName ──────────────────────────────
                                        case 'tool-findStationByName': {
                                            if (part.state === 'input-streaming' || part.state === 'input-available') {
                                                return (
                                                    <div key={index} className="self-start flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
                                                        <Search className="h-3 w-3 animate-pulse" />
                                                        <span>Đang tìm ga tàu...</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        // ── searchTrainTrips ───────────────────────────────
                                        case 'tool-searchTrainTrips': {
                                            if (part.state === 'input-streaming' || part.state === 'input-available') {
                                                return (
                                                    <div key={index} className="self-start bg-muted rounded-xl rounded-tl-sm p-3 space-y-2 w-full max-w-[90%]">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-0.5">
                                                                {[0, 1, 2].map((i) => (
                                                                    <span key={i} className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce"
                                                                        style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }} />
                                                                ))}
                                                            </div>
                                                            <span>Đang tìm chuyến tàu...</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {[1, 2].map((i) => (
                                                                <div key={i} className="h-24 rounded-lg bg-muted-foreground/10 animate-pulse" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            if (part.state === 'output-available') {
                                                const output = part.output as { trips: any[]; date: string };
                                                return (
                                                    <div key={index} className="self-start w-full max-w-[90%]">
                                                        <TripSearchResult trips={output.trips} date={output.date} />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        // ── getMyBookings ──────────────────────────────────
                                        case 'tool-getMyBookings': {
                                            if (part.state === 'input-streaming' || part.state === 'input-available') {
                                                return <BouncingDots key={index} label="Đang lấy lịch sử đặt vé..." />;
                                            }
                                            if (part.state === 'output-available') {
                                                const output = part.output as { bookings?: any[]; error?: string };
                                                if (output.error) return <p key={index} className="self-start text-xs text-muted-foreground px-2">{output.error}</p>;
                                                return (
                                                    <div key={index} className="self-start w-full max-w-[90%]">
                                                        <BookingHistoryResult bookings={output.bookings ?? []} />
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        // ── getWalletBalance ───────────────────────────────
                                        case 'tool-getWalletBalance': {
                                            if (part.state === 'input-streaming' || part.state === 'input-available') {
                                                return <BouncingDots key={index} label="Đang lấy thông tin ví..." />;
                                            }
                                            if (part.state === 'output-available') {
                                                const output = part.output as { balance?: number; error?: string };
                                                if (output.error) return <p key={index} className="self-start text-xs text-muted-foreground px-2">{output.error}</p>;
                                                return (
                                                    <div key={index} className="self-start rounded-xl border bg-card p-3 w-full max-w-[90%] space-y-1">
                                                        <p className="text-xs text-muted-foreground">Số dư ví</p>
                                                        <p className="text-lg font-bold text-primary">{(output.balance ?? 0).toLocaleString('vi-VN')} ₫</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        // ── getPassengerGroups ─────────────────────────────
                                        case 'tool-getPassengerGroups': {
                                            if (part.state === 'output-available') {
                                                const groups = part.output as { name: string; discountPercent: number }[];
                                                return (
                                                    <div key={index} className="self-start rounded-xl border bg-card p-3 w-full max-w-[90%] space-y-1.5">
                                                        <p className="text-xs font-medium text-muted-foreground">Loại hành khách</p>
                                                        {groups.map((g, i) => (
                                                            <div key={i} className="flex items-center justify-between text-sm">
                                                                <span>{g.name}</span>
                                                                <span className="text-xs text-primary font-semibold">
                                                                    {g.discountPercent === 0 ? 'Giá gốc' : `-${g.discountPercent}%`}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        // ── getRoutes ──────────────────────────────────────
                                        case 'tool-getRoutes': {
                                            if (part.state === 'output-available') {
                                                const routes = part.output as { name: string; stations: string[] }[];
                                                return (
                                                    <div key={index} className="self-start rounded-xl border bg-card p-3 w-full max-w-[90%] space-y-2">
                                                        <p className="text-xs font-medium text-muted-foreground">Tuyến đường</p>
                                                        {routes.map((r, i) => (
                                                            <div key={i}>
                                                                <p className="font-medium text-sm">{r.name}</p>
                                                                <p className="text-xs text-muted-foreground">{r.stations.join(' → ')}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }

                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        ))
                    )}
                    {isLoading && (() => {
                        const lastMsg = messages[messages.length - 1];
                        const lastIsUser = lastMsg?.role === "user";
                        // Hide if tool output already rendered (AI may still be generating hidden text)
                        const hasToolOutput = lastMsg?.parts?.some(
                            (p) => ['tool-searchTrainTrips', 'tool-getMyBookings', 'tool-getWalletBalance', 'tool-getPassengerGroups', 'tool-getRoutes']
                                .includes(p.type) && (p as any).state === 'output-available'
                        );
                        const lastIsEmptyAssistant = lastMsg?.role === "assistant" &&
                            !lastMsg.parts?.some((p) => p.type === "text" && (p as any).text?.trim());
                        if (!lastIsUser && (!lastIsEmptyAssistant || hasToolOutput)) return null;
                        return (
                            <div className="self-start rounded-xl rounded-tl-sm bg-muted px-4 py-3 flex items-center gap-1">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                                        style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
                                    />
                                ))}
                            </div>
                        );
                    })()}
                    {/* Suggestion chips — shown after AI responds */}
                    {status === "ready" && messages.length > 0 && (
                        <SuggestionChips onSelect={handleSend} />
                    )}
                </div>

                {/* Input */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim()) {
                            sendMessage({ text: input });
                            setInput("");
                        }
                    }}
                    className="border-t bg-background p-3 flex gap-2"
                >
                    <input
                        className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={input}
                        placeholder="Nhập câu hỏi..."
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={isLoading || !input.trim()}
                        className="rounded-full h-9 w-9 shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </SheetContent>
            </Sheet>

            {/* Navbar Toggle Button */}
            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "flex-shrink-0",
                    isOpen && "bg-muted text-muted-foreground"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            </Button>
        </>
    );
}
