"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { IconArrowDown, IconArrowsSort, IconArrowUp, IconSearch, IconTrash, IconEdit } from "@tabler/icons-react"
import { useTrips, useDeleteTrip } from "@/features/trips/hooks/use-trips"
import { Trip } from "@/lib/schemas/trip.schema"

import { TripStatusBadge } from "@/lib/utils/trip-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TableSkeleton } from "@/components/custom/table-skeleton"
import { CreateTripDialog } from "./create-trip-dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"


export function TripsTable() {
    const router = useRouter()
    const deleteTrip = useDeleteTrip()
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [searchValue, setSearchValue] = React.useState("")
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
    const [tripToDelete, setTripToDelete] = React.useState<string | null>(null)
    const [filters, setFilters] = React.useState<{
        page: number;
        limit: number;
        search?: string;
        sort?: string;
        order?: 'asc' | 'desc';
    }>({
        page: 1,
        limit: 10,
    })

    const { data: tripData, isLoading } = useTrips(filters)

    const trips = tripData?.data || []
    const meta = tripData?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setTripToDelete(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = () => {
        if (tripToDelete) {
            deleteTrip.mutate(tripToDelete, {
                onSuccess: () => {
                    toast.success("Xóa chuyến đi thành công")
                    setDeleteDialogOpen(false)
                    setTripToDelete(null)
                },
                onError: () => {
                    toast.error("Không thể xóa chuyến đi")
                }
            })
        }
    }

    const columns: ColumnDef<Trip>[] = [
        {
            id: "index",
            header: "TT",
            cell: ({ row }) => <div className="w-[50px]">{row.index + 1}</div>,
            enableSorting: false,
        },
        {
            accessorKey: "route.name",
            header: "Tuyến đường",
            cell: ({ row }) => <div className="font-medium">{row.original.route?.name || "N/A"}</div>,
        },
        {
            accessorKey: "train.code",
            header: "Tàu",
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.train?.code || "N/A"}</div>
                    <div className="text-sm text-muted-foreground">{row.original.train?.name}</div>
                </div>
            ),
        },
        {
            accessorKey: "departureTime",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Thời gian khởi hành
                        {column.getIsSorted() === "asc" ? (
                            <IconArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <IconArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <IconArrowsSort className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const datetime = new Date(row.getValue("departureTime"));
                return (
                    <div>
                        <div className="font-medium">{datetime.toLocaleDateString('vi-VN')}</div>
                        <div className="text-sm text-muted-foreground">{datetime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                )
            },
        },
        {
            accessorKey: "endTime",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Thời gian kết thúc
                        {column.getIsSorted() === "asc" ? (
                            <IconArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === "desc" ? (
                            <IconArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <IconArrowsSort className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                )
            },
            cell: ({ row }) => {
                const datetime = new Date(row.getValue("endTime"));
                return (
                    <div>
                        <div className="font-medium">{datetime.toLocaleDateString('vi-VN')}</div>
                        <div className="text-sm text-muted-foreground">{datetime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                )
            },
        },
        {
            accessorKey: "status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <div className="flex justify-center">
                        <TripStatusBadge status={status} />
                    </div>
                )
            },
        },
        {
            id: "tickets",
            header: "Số vé",
            cell: ({ row }) => {
                const count = row.original._count?.tickets || 0;
                return <div className="text-center">{count}</div>
            },
        },
    ]

    // Sync sorting
    React.useEffect(() => {
        if (sorting.length > 0) {
            const sort = sorting[0]
            setFilters(prev => ({
                ...prev,
                sort: sort.id,
                order: sort.desc ? 'desc' : 'asc'
            }))
        } else {
            setFilters(prev => {
                const { sort, order, ...rest } = prev;
                return rest;
            })
        }
    }, [sorting])

    // Debounce search
    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchValue) {
                setFilters(prev => ({ ...prev, search: searchValue, page: 1 }))
            } else {
                setFilters(prev => {
                    const { search, ...rest } = prev;
                    return { ...rest, page: 1 };
                })
            }
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [searchValue])

    const onPaginationChange = (pageIndex: number) => {
        setFilters(prev => ({ ...prev, page: pageIndex + 1 }))
    }

    const table = useReactTable({
        data: trips,
        columns,
        pageCount: meta.totalPages,
        manualPagination: true,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            pagination: {
                pageIndex: meta.page - 1,
                pageSize: meta.limit,
            }
        },
        onPaginationChange: (updater) => {
            if (typeof updater === 'function') {
                const newState = updater({
                    pageIndex: meta.page - 1,
                    pageSize: meta.limit,
                })
                onPaginationChange(newState.pageIndex)
            } else {
                onPaginationChange(updater.pageIndex)
            }
        }
    })

    return (
        <div className="w-full">
            <div className="flex items-center py-4 gap-4">
                <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                        placeholder="Tìm kiếm chuyến đi..."
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="h-11 rounded-2xl bg-white dark:bg-zinc-900 border-rose-100/50 dark:border-zinc-800 focus-visible:ring-[#802222]/20 pl-11 text-sm transition-all"
                    />
                </div>
                <div className="ml-auto">
                    <Button 
                        onClick={() => router.push('/admin/trips/create')} 
                        className="bg-[#802222] hover:bg-rose-900 text-white rounded-xl h-11 font-bold border-none shadow-lg shadow-rose-900/20 px-6 transition-all active:scale-95 hover:scale-[1.02]"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Thêm chuyến đi
                    </Button>
                </div>
            </div>
            <div className="rounded-[2.5rem] bg-white dark:bg-zinc-900 overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-lg shadow-rose-900/[0.015]">
                <Table>
                    <TableHeader className="bg-rose-50/20 dark:bg-zinc-800/20">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-none h-16">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="text-xs font-bold uppercase tracking-widest text-[#802222]/50 first:pl-8 last:pr-8">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableSkeleton columnCount={columns.length} rowCount={10} />
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="cursor-pointer hover:bg-rose-50/10 border-none transition-all h-16"
                                    onClick={() => router.push(`/admin/trips/${row.original.id}`)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="first:pl-8 last:pr-8">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Không có dữ liệu.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Hiển thị {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} - {Math.min(meta.page * meta.limit, meta.total)} trong tổng số {meta.total} chuyến đi
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Trước
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Tiếp
                    </Button>
                </div>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md rounded-[2.5rem] border-none shadow-none bg-white dark:bg-zinc-950 p-0 overflow-hidden">
                    <AlertDialogHeader className="p-8 pb-4">
                        <AlertDialogTitle className="text-xl font-bold text-red-600 dark:text-red-400 tracking-tight flex items-center gap-2">
                            <IconTrash className="w-5 h-5 opacity-40" />
                            Xác nhận xóa chuyến
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-xs font-medium text-muted-foreground/50 leading-relaxed">
                            Bạn có chắc chắn muốn xóa chuyến đi này? 
                            <br />
                            <br />
                            <span className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 font-bold flex items-start gap-2">
                                <span>⚠️</span>
                                <span>Cảnh báo: Toàn bộ dữ liệu vé và lịch trình liên quan sẽ bị xóa vĩnh viễn.</span>
                            </span>
                            <br />
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="p-8 pt-2 gap-3">
                        <AlertDialogCancel className="rounded-xl font-medium border-none hover:bg-zinc-100 dark:hover:bg-zinc-800">Hủy</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete} 
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-11 font-bold border-none shadow-none px-8"
                        >
                            Xác nhận xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
