import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import { Search, X } from "lucide-react";
import clsxm from "@/lib/clsxm";

type SearchFieldProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	"aria-label"?: string;
	className?: string;
};

/** Standalone search box; same size and look as the table filter. */
export default function SearchField({
	value,
	onChange,
	placeholder,
	"aria-label": ariaLabel,
	className,
}: SearchFieldProps) {
	return (
		<div className={clsxm("relative", className)}>
			<OutlinedInput
				fullWidth
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				inputProps={{ "aria-label": ariaLabel }}
				sx={{
					height: 36.5,
					fontSize: "0.875rem",
					color: "rgb(17 24 39)",
					bgcolor: "white",
					boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
					"& .MuiOutlinedInput-input": {
						py: 0,
						height: "100%",
						"&::placeholder": { color: "rgb(156 163 175)", opacity: 1 },
					},
					"& .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgb(209 213 219)",
					},
					"&:hover .MuiOutlinedInput-notchedOutline": {
						borderColor: "rgb(209 213 219)",
					},
				}}
				startAdornment={
					<InputAdornment position="start" sx={{ mr: 1 }}>
						<Search className="text-gray-400" size={18} aria-hidden />
					</InputAdornment>
				}
				endAdornment={
					value !== "" ? (
						<InputAdornment position="end">
							<button
								type="button"
								onClick={() => onChange("")}
								aria-label="Clear search"
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
