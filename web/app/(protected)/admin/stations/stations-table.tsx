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
import { IconArrowDown, IconArrowsSort, IconArrowUp, IconPlus, IconSearch } from "@tabler/icons-react"
import { useStations } from "@/features/stations/hooks/use-stations"
import { Button } from "@/components/ui/button"
import { CreateStationDialog } from "./create-station-dialog"
import { StationDetailDialog } from "./station-detail-dialog"
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

import { Station } from "@/lib/schemas/station.schema"

export const columns: ColumnDef<Station>[] = [
    {
        id: "index",
        header: "TT",
        cell: ({ row }) => (
            <div className="w-[50px]">{row.index + 1}</div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Tên trạm
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
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "latitute",
        header: "Vĩ độ",
        cell: ({ row }) => <div>{row.getValue("latitute")}</div>,
    },
    {
        accessorKey: "longtitute",
        header: "Kinh độ",
        cell: ({ row }) => <div>{row.getValue("longtitute")}</div>,
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Ngày tạo
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
            const date = new Date(row.getValue("createdAt"));
            return <div className="text-muted-foreground">{date.toLocaleDateString('vi-VN')}</div>
        },
    },
]

export function StationsTable() {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})
    const [searchValue, setSearchValue] = React.useState("")

    const [selectedStationId, setSelectedStationId] = React.useState<string | null>(null)
    const [detailOpen, setDetailOpen] = React.useState(false)

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

    const { data: stationData, isLoading } = useStations(filters)

    const stations = stationData?.data || []
    const meta = stationData?.meta || { total: 0, page: 1, limit: 10, totalPages: 0 }

    const selectedStation = React.useMemo(() =>
        stations.find(s => s.id === selectedStationId) || null
        , [stations, selectedStationId])

    // Sync sorting state with API filters
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
        data: stations,
        columns,
        pageCount: meta.totalPages,
        manualPagination: true,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
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
            <StationDetailDialog
                open={detailOpen}
                onOpenChange={setDetailOpen}
                station={selectedStation}
                currentPage={meta.page}
                totalItems={meta.total}
                itemsPerPage={meta.limit}
                itemsOnCurrentPage={stations.length}
                onNavigateToPreviousPage={() => {
                    setFilters(prev => ({ ...prev, page: prev.page - 1 }))
                }}
            />
            <div className="flex items-center py-4 gap-2">
                <div className="relative flex-1 max-w-sm">
                    <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm trạm..."
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="ml-auto">
                    <CreateStationDialog />
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
                                    onClick={() => {
                                        setSelectedStationId(row.original.id)
                                        setDetailOpen(true)
                                    }}
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
                    Hiển thị {meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0} - {Math.min(meta.page * meta.limit, meta.total)} trong tổng số {meta.total} trạm
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
