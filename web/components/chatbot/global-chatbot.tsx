"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GlobalChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const { messages, sendMessage, status } =
        useChat({
            transport: new DefaultChatTransport({
                api: process.env.NEXT_PUBLIC_API_URL + "/api/chat",
            }),
            onError: (error) => {
                console.error("Chat error:", error);
            },
        });

    const isLoading = status === "submitted" || status === "streaming";

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <div className="fixed bottom-8 right-8 z-[9999] flex flex-col items-end pointer-events-none sm:right-8">
            {/* Search popup container */}
            <div
                className={cn(
                    "mb-4 overflow-hidden rounded-2xl border bg-background shadow-xl transition-all duration-300 ease-in-out sm:w-[400px] w-[calc(100vw-3rem)] pointer-events-auto",
                    isOpen
                        ? "translate-y-0 opacity-100 scale-100"
                        : "pointer-events-none translate-y-4 opacity-0 scale-95",
                )}
            >
                {/* Chat header */}
                <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
                    <div className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        <h3 className="font-semibold">Trợ lý ảo</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-primary-foreground/20 text-primary-foreground"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Message area */}
                <div
                    ref={scrollRef}
                    className="flex h-[400px] flex-col gap-4 overflow-y-auto p-4 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                            <Bot className="mb-2 h-10 w-10 opacity-20" />
                            <p className="text-sm">Xin chào! Tôi có thể giúp gì cho bạn?</p>
                        </div>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
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
                                <div className={cn("prose prose-sm max-w-none break-words whitespace-pre-wrap", m.role === "user" ? "prose-invert" : "dark:prose-invert")}>
                                    {m.parts?.map((part, index) =>
                                        part.type === "text" ? <span key={index}>{part.text}</span> : null,
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="self-start rounded-xl rounded-tl-sm bg-muted px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Input area */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (input.trim()) {
                            sendMessage({ text: input });
                            setInput('');
                        }
                    }}
                    className="border-t bg-background p-3 flex gap-2"
                >
                    <input
                        className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
            </div>

            {/* Floating Toggle Button */}
            <Button
                size="icon"
                className={cn(
                    "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 pointer-events-auto",
                    isOpen ? "bg-muted text-muted-foreground hover:bg-muted/90 hover:text-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </Button>
        </div>
    );
}
