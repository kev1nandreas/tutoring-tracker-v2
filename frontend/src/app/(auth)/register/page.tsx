import type { Metadata } from "next";
import RegisterForm from "./_components/RegisterForm";

export const metadata: Metadata = {
	title: "Create account",
	description: "Create a student account on Tutoring Tracker.",
};

export default function RegisterPage() {
	return <RegisterForm />;
}
