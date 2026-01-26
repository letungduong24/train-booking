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
import { getTripStatusInfo } from "@/lib/trip-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
                const { label, variant, colorClass } = getTripStatusInfo(status);
                // Badge variant only supports specific keys, so we might override with className if needed
                // But shadcn Badge variants are tied to background colors usually.
                // Let's use outline variant and apply colorClass for custom colors if needed, 
                // OR map our variant to BadgeProps['variant']

                return <Badge variant={variant} className={colorClass}>{label}</Badge>
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
            <div className="flex items-center py-4 gap-2">
                <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm chuyến đi..."
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="ml-auto">
                    <CreateTripDialog />
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
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
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => router.push(`/admin/trips/${row.original.id}`)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa chuyến đi này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>Xóa</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
