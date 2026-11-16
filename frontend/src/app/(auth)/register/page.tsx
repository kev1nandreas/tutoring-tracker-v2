import type { Metadata } from "next";
import RegisterForm from "./_components/RegisterForm";

export const metadata: Metadata = {
	title: "Register",
	description: "Create a student account",
};

export default function RegisterPage() {
	return <RegisterForm />;
}
