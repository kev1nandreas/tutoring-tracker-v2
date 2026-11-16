"use client";

import withAuth from "@/components/hoc/withAuth";
import CompleteProfileForm from "./CompleteProfileForm";

/** Needs a signed-in student; anyone else is sent to their own home by `withAuth`. */
const Guarded = withAuth(CompleteProfileForm, { roles: ["student"] });

export default function CompleteProfileGuard() {
	return <Guarded />;
}
