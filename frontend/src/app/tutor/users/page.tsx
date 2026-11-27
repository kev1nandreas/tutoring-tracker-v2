import type { Metadata } from "next";
import UsersView from "./_components/UsersView";

export const metadata: Metadata = {
	title: "Users",
	description: "Every registered user.",
};

export default function UsersPage() {
	return <UsersView />;
}
