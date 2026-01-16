"use client"

import * as React from "react"
import {
    ColumnDef,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { IconArrowDown, IconArrowsSort, IconArrowUp, IconSearch } from "@tabler/icons-react"
import { useTrains } from "@/features/trains/hooks/use-trains"
import { Train } from "@/lib/schemas/train.schema"
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
import { CreateTrainDialog } from "./create-train-dialog"
import { EditTrainDialog } from "./edit-train-dialog"
import { DeleteTrainAlert } from "./delete-train-alert"

export const columns: ColumnDef<Train>[] = [
    {
        id: "index",
        header: "TT",
        cell: ({ row }) => <div className="w-[50px]">{row.index + 1}</div>,
        enableSorting: false,
    },
    {
        accessorKey: "code",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Mã tàu
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
        cell: ({ row }) => <div className="font-medium">{row.getValue("code")}</div>,
    },
    {
        accessorKey: "name",
        header: "Tên tàu",
        cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return <div className="text-muted-foreground">{date.toLocaleDateString('vi-VN')}</div>
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const train = row.original;
            return (
                <div className="flex items-center gap-2">
                    <EditTrainDialog train={train} />
                    <DeleteTrainAlert train={train} />
                </div>
            )
        },
    },
]

export function TrainsTable() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [searchValue, setSearchValue] = React.useState("")
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

    const { data: trainData, isLoading } = useTrains(filters)

    const trains = trainData?.data || []
    const meta = trainData?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }

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
        data: trains,
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
                        placeholder="Tìm kiếm tàu..."
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="ml-auto">
                    <CreateTrainDialog />
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
                    Hiển thị {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} - {Math.min(meta.page * meta.limit, meta.total)} trong tổng số {meta.total} tàu
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
        </div>
    )
}
