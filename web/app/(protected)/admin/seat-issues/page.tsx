"use client"

import * as React from "react"
import apiClient from "@/lib/api-client"
import { Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format, parseISO } from "date-fns"
import { vi } from "date-fns/locale"
import { useSocketStore } from "@/lib/store/socket.store"
import Link from "next/link"

export default function AdminSeatIssuesPage() {
  const [issues, setIssues] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { socket } = useSocketStore();

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/seat-issues');
      setIssues(response.data || []);
    } catch (error) {
      console.error("Failed to fetch admin issues:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchIssues();
  }, []);

  React.useEffect(() => {
    if (!socket) return;
    function onSeatIssueUpdated() {
      fetchIssues();
    }
    socket.on("seat-issues.updated", onSeatIssueUpdated);
    return () => {
      socket.off("seat-issues.updated", onSeatIssueUpdated);
    };
  }, [socket]);

  if (loading && issues.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-20 min-h-[50vh]">
        <Loader2 className="size-10 animate-spin text-[#802222]" />
      </div>
    );
  }

  // Categories
  const pendingIssues = issues.filter(i => i.status === "PENDING");
  const waitingIssues = issues.filter(i => i.status === "WAITING_CUSTOMER_CONFIRMATION");
  const resolvedIssues = issues.filter(i => i.status === "RESOLVED");
  const rejectedIssues = issues.filter(i => i.status === "REJECTED");

  const renderIssueTable = (filtered: any[]) => {
    if (filtered.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-50/20 dark:bg-zinc-800/10 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-zinc-800/40">
          <p className="text-xs font-semibold text-muted-foreground opacity-60">Không có báo cáo sự cố nào trong danh sách</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="border-b border-gray-100 dark:border-zinc-800 text-[10px] text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4">Ngày báo</th>
              <th className="py-3 px-4">Tàu & Toa</th>
              <th className="py-3 px-4">Ghế ngồi</th>
              <th className="py-3 px-4">Loại sự cố</th>
              <th className="py-3 px-4">Người báo</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((issue) => {
              const dateStr = format(parseISO(issue.createdAt), "HH:mm dd/MM", { locale: vi });
              return (
                <tr
                  key={issue.id}
                  className="border-b border-gray-50 dark:border-zinc-800/40 hover:bg-gray-50/30 dark:hover:bg-zinc-800/10 transition-colors"
                >
                  <td className="py-4 px-4 text-muted-foreground">{dateStr}</td>
                  <td className="py-4 px-4 text-gray-900 dark:text-white font-bold">
                    {issue.seat?.coach?.train?.name} (Toa {issue.seat?.coach?.name || issue.seat?.coach?.order})
                  </td>
                  <td className="py-4 px-4 text-gray-900 dark:text-white font-black">
                    Ghế {issue.seat?.name}
                  </td>
                  <td className="py-4 px-4">
                    <Badge className="bg-amber-50 text-amber-600 border-none px-2.5 py-0.5 rounded-full text-[9px]">
                      {issue.issueType}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">
                    {issue.reportedBy?.name || "Tài xế"}
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={`text-[8px] px-2.5 py-0.5 rounded-full border-none font-bold ${
                      issue.status === "PENDING"
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                        : issue.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : issue.status === "REJECTED"
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                    }`}>
                      {issue.status === "PENDING"
                        ? "Chờ xử lý"
                        : issue.status === "RESOLVED"
                        ? "Đã giải quyết"
                        : issue.status === "REJECTED"
                        ? "Bị từ chối"
                        : "Chờ khách đổi"}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-lg text-xs font-bold border-[#802222]/20 text-[#802222] hover:bg-rose-50"
                      asChild
                    >
                      <Link href={`/admin/seat-issues/${issue.id}`}>
                        Xem chi tiết
                      </Link>
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col gap-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-[#802222] dark:text-rose-400">Quản lý sự cố ghế hỏng</h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium opacity-65">
          Tiếp nhận báo cáo từ Lái tàu, xác nhận khóa ghế sự cố, tự động điều phối đổi ghế trống hoặc hoàn tiền cho khách.
        </p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="flex flex-wrap w-full md:w-auto h-auto items-center justify-start rounded-xl bg-gray-100/50 dark:bg-zinc-800/50 p-1 text-muted-foreground mb-6 border border-gray-100 dark:border-zinc-800/20">
          <TabsTrigger value="pending" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Chờ xử lý ({pendingIssues.length})
          </TabsTrigger>
          <TabsTrigger value="waiting" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Chờ khách chốt ({waitingIssues.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Đã giải quyết ({resolvedIssues.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Đã từ chối ({rejectedIssues.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg px-5 py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#802222]">
            Tất cả ({issues.length})
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6">
          <TabsContent value="pending" className="mt-0 focus-visible:outline-none">{renderIssueTable(pendingIssues)}</TabsContent>
          <TabsContent value="waiting" className="mt-0 focus-visible:outline-none">{renderIssueTable(waitingIssues)}</TabsContent>
          <TabsContent value="resolved" className="mt-0 focus-visible:outline-none">{renderIssueTable(resolvedIssues)}</TabsContent>
          <TabsContent value="rejected" className="mt-0 focus-visible:outline-none">{renderIssueTable(rejectedIssues)}</TabsContent>
          <TabsContent value="all" className="mt-0 focus-visible:outline-none">{renderIssueTable(issues)}</TabsContent>
        </Card>
      </Tabs>
    </div>
  )
}
