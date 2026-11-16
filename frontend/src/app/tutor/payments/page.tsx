import type { Metadata } from "next";
import PaymentsView from "./_components/PaymentsView";

export const metadata: Metadata = {
	title: "Payments",
	description: "Payments from your students. Paid ones count as income.",
};

export default function PaymentsPage() {
	return <PaymentsView />;
}
