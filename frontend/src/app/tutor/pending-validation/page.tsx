import type { Metadata } from "next";
import PendingValidationView from "./_components/PendingValidationView";

export const metadata: Metadata = {
	title: "Pending validation",
	description: "Accept or reject students who asked to join your tutorials.",
};

export default function PendingValidationPage() {
	return <PendingValidationView />;
}
