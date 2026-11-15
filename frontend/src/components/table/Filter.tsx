import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import type { RowData, Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";
import * as React from "react";
import clsxm from "@/lib/clsxm";

type FilterProps<T extends RowData> = {
	table: Table<T>;
	placeholder?: string;
} & React.ComponentPropsWithoutRef<"div">;

export default function Filter<T extends RowData>({
	className,
	table,
	placeholder = "Cari Data",
	...rest
}: FilterProps<T>) {
	const [filter, setFilter] = React.useState(
		() => (table.getState().globalFilter as string | undefined) ?? "",
	);

	const handleClearFilter = () => {
		table.setGlobalFilter("");
		setFilter("");
	};

	React.useEffect(() => {
		const timeout = setTimeout(() => {
			table.setGlobalFilter(filter);
		}, 360);
		return () => clearTimeout(timeout);
	}, [filter, table]);

	return (
		<div className={clsxm("relative", className)} {...rest}>
			<OutlinedInput
				fullWidth
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				placeholder={placeholder}
				// Height matches MUI medium buttons (6px padding + 24.5px line height).
				sx={{
					height: 36.5,
					fontSize: "0.875rem",
					color: "rgb(17 24 39)",
					bgcolor: "white",
					boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
					"& .MuiOutlinedInput-input": {
						py: 0,
						height: "100%",
						caretColor: "#e66767",
						"&::placeholder": { color: "rgb(156 163 175)", opacity: 1 },
					},
					"& .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgb(209 213 219)",
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgb(209 213 219)",
					},
					"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
						borderColor: "#e66767",
						borderWidth: 1,
						boxShadow: "0 0 0 1px #e66767",
					},
				}}
				startAdornment={
					<InputAdornment position="start" sx={{ mr: 1 }}>
						<Search className="text-gray-400" size={18} />
					</InputAdornment>
				}
				endAdornment={
					filter !== "" ? (
						<InputAdornment position="end">
							<button
								type="button"
								onClick={handleClearFilter}
								aria-label="Hapus pencarian"
								className="p-1"
							>
								<X className="text-gray-400 hover:text-gray-600" size={18} />
							</button>
						</InputAdornment>
					) : undefined
				}
			/>
		</div>
	);
}
