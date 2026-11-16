"use client";

import {
	flexRender,
	type Row,
	type RowData,
	type Table,
} from "@tanstack/react-table";
import * as React from "react";

import clsxm from "@/lib/clsxm";

interface Linkable {
	href?: string;
}

type TBodyProps<T extends RowData> = {
	table: Table<T>;
	isLoading?: boolean;
	withLink?: boolean;
	renderSubComponent?: (row: Row<T>) => React.ReactNode;
} & React.ComponentPropsWithoutRef<"div">;

type ExpandableRowProps = {
	expanded: boolean;
	colSpan: number;
	children: () => React.ReactNode;
};

/** Sub-row that animates its height open/closed. Content mounts on first expand. */
function ExpandableRow({ expanded, colSpan, children }: ExpandableRowProps) {
	const [hasExpanded, setHasExpanded] = React.useState(expanded);

	React.useEffect(() => {
		if (expanded) setHasExpanded(true);
	}, [expanded]);

	if (!expanded && !hasExpanded) return null;

	return (
		<tr style={expanded ? undefined : { borderTopWidth: 0 }}>
			<td
				colSpan={colSpan}
				className="bg-white p-0 text-left text-sm text-gray-700"
			>
				<div
					className={clsxm(
						"grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
						expanded
							? "grid-rows-[1fr] opacity-100"
							: "grid-rows-[0fr] opacity-0",
					)}
					inert={!expanded}
				>
					<div className="min-h-0 overflow-hidden">
						<div className="px-4 pb-4">{children()}</div>
					</div>
				</div>
			</td>
		</tr>
	);
}

export default function TBody<T extends RowData & Linkable>({
	className,
	isLoading,
	table,
	withLink = false,
	renderSubComponent,
	...rest
}: TBodyProps<T>) {
	const renderRow = (row: Row<T>) => {
		const rowContent = (
			<>
				{row.getVisibleCells().map((cell) => (
					<td
						key={cell.id}
						className={clsxm(
							"px-3 py-3 text-sm text-gray-700",
							cell.column.columnDef.meta?.align === "left"
								? "min-w-48 whitespace-normal break-words pl-4 text-left"
								: "whitespace-nowrap text-center",
						)}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</td>
				))}
			</>
		);

		if (withLink && "href" in row.original) {
			return (
				<tr
					key={row.id}
					className="rounded-lg hover:bg-gray-50 cursor-pointer"
					onClick={() => {
						const href = (row.original as { href: string }).href;
						window.location.href = href;
					}}
				>
					{rowContent}
				</tr>
			);
		}

		const canExpand = !!renderSubComponent && row.getCanExpand();

		return (
			<React.Fragment key={row.id}>
				<tr
					className={clsxm(
						"rounded-lg",
						canExpand &&
							"cursor-pointer transition-colors duration-200 hover:bg-gray-50",
					)}
					onClick={canExpand ? row.getToggleExpandedHandler() : undefined}
				>
					{rowContent}
				</tr>
				{canExpand && (
					<ExpandableRow
						expanded={row.getIsExpanded()}
						colSpan={row.getVisibleCells().length}
					>
						{() => renderSubComponent(row)}
					</ExpandableRow>
				)}
			</React.Fragment>
		);
	};

	return (
		<tbody
			className={clsxm("divide-y divide-gray-100 bg-white", className)}
			{...rest}
		>
			{isLoading ? (
				<tr>
					<td
						className="col-span-full truncate whitespace-nowrap px-3 py-3 text-center text-sm text-gray-500"
						colSpan={table.getAllColumns().length}
					>
						Loading...
					</td>
				</tr>
			) : table.getRowModel().rows.length === 0 ? (
				<tr>
					<td
						className="col-span-full truncate whitespace-nowrap px-3 py-3 text-center text-sm text-gray-500"
						colSpan={table.getAllColumns().length}
					>
						No Data
					</td>
				</tr>
			) : (
				table.getRowModel().rows.map((row) => renderRow(row))
			)}
		</tbody>
	);
}
