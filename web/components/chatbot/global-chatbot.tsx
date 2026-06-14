"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { X, Send, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { BouncingDots } from "@/features/chatbot/components/chat-loading";
import { ChatToolPart } from "@/features/chatbot/components/chat-tool-part";
import { fetchWithChatbotAuth, getChatbotApiUrl } from "@/features/chatbot/lib/chatbot-api";
import {
    CHATBOT_SUGGESTIONS,
    hasChatbotDataTool,
    hasChatbotDataToolOutput,
} from "@/features/chatbot/lib/chatbot.constants";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from "@/components/ui/sheet";

function SuggestionChips({ onSelect, disabled }: { onSelect: (text: string) => void; disabled?: boolean }) {
    return (
        <div className="flex flex-wrap gap-1.5 px-1">
            {CHATBOT_SUGGESTIONS.map((text) => (
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
                api: getChatbotApiUrl(),
                credentials: 'include',
                fetch: fetchWithChatbotAuth,
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
                        messages.map((m, messageIndex) => (
                            <div key={m.id} className="flex flex-col gap-2">
                                {m.parts?.map((part, index) => {
                                    switch (part.type) {
                                        // ── Text ──────────────────────────────────────────────
                                        case 'text': {
                                            if (!part.text.trim()) return null;
                                            const isLatestMessage = messageIndex === messages.length - 1;
                                            const isStreamingAssistantText = m.role === "assistant" && isLatestMessage && isLoading;
                                            const hasDataTool = hasChatbotDataTool(m.parts as any);
                                            if (isStreamingAssistantText || hasDataTool) return null;
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

                                        default:
                                            return <ChatToolPart key={index} part={part} />;
                                    }
                                })}
                            </div>
                        ))
                    )}
                    {isLoading && (() => {
                        const lastMsg = messages[messages.length - 1];
                        const lastIsUser = lastMsg?.role === "user";
                        // Hide if tool output already rendered (AI may still be generating hidden text)
                        const hasToolOutput = hasChatbotDataToolOutput(lastMsg?.parts as any);
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
            <button
                className={cn(
                    "size-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-zinc-50 dark:bg-zinc-900 text-muted-foreground/60 hover:text-[#802222] hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/20",
                    isOpen && "bg-rose-50 dark:bg-rose-900/10 text-[#802222] border-rose-100 dark:border-rose-900/20"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="size-5" /> : <Bot className="size-5" />}
            </button>
        </>
    );
}
