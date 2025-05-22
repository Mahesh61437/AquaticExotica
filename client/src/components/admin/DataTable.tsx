import { useState, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2 } from "lucide-react";

export interface PaginationProps {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
  }[];
  pagination: PaginationProps;
  isLoading: boolean;
  emptyMessage?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  searchField?: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
  };
}

export function DataTable<T>({
  data,
  columns,
  pagination,
  isLoading,
  emptyMessage = "No data found.",
  onPageChange,
  onLimitChange,
  searchField,
}: DataTableProps<T>) {
  const { page, limit, totalCount, totalPages } = pagination;

  return (
    <div className="space-y-4">
      {/* Search field if provided */}
      {searchField && (
        <div className="flex justify-end mb-4">
          <div className="relative w-full md:w-64">
            <Input 
              type="text" 
              placeholder={searchField.placeholder}
              value={searchField.value}
              onChange={(e) => searchField.onChange(e.target.value)}
              className="pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, i) => (
                  <TableHead key={i} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length > 0 ? (
                data.map((item, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className={column.className}>
                        {typeof column.accessor === 'function' 
                          ? column.accessor(item)
                          : String(item[column.accessor] ?? '')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-6">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-2 border-t">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Label htmlFor="itemsPerPage">Show</Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => onLimitChange(Number(value))}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue placeholder={limit.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                of {totalCount} entries
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(1)}
                disabled={page === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="mx-2 text-sm">
                Page {page} of {totalPages || 1}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(totalPages)}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}