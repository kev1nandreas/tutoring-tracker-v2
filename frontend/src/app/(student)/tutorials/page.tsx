import type { Metadata } from "next";
import MyTutorialsView from "./_components/MyTutorialsView";

export const metadata: Metadata = {
	title: "My tutorials",
	description: "The classes you were accepted into.",
};

export default function MyTutorialsPage() {
	return <MyTutorialsView />;
}
