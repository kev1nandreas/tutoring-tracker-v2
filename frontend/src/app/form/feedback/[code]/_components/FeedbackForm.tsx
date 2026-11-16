"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useAuthStore from "@/app/stores/useAuthStore";
import Button from "@/components/button/Button";
import Typography from "@/components/Typography";
import { ApiError } from "@/lib/errors";
import {
	fetchFeedbackForm,
	submitFeedback,
} from "@/services/api/main/feedback";
import { PATH } from "@/shared/path";

type Lang = "id" | "en";

const T = {
	id: {
		tag: "Umpan balik kelas",
		with: "bersama",
		anon: "Anonim: emailmu hanya dipakai agar tidak mengisi dua kali dan tidak disimpan bersama jawabanmu.",
		email: "Email",
		delivery: "Penyampaian materi",
		interactive: "Interaktif",
		learnAgain: "Keinginan belajar lagi dengan tutor",
		low: "Kurang",
		high: "Sangat baik",
		progress: "terisi",
		yourEmail: "Emailmu",
		unclear:
			"Materi apa yang belum kamu pahami dan ingin dijadikan bahan pembahasan pada tutorial selanjutnya?",
		message: "Apa pesan dan kesan kamu agar tutor bisa lebih baik lagi?",
		send: "Kirim",
		of5: "dari 5",
		notFound: "Formulir tidak ditemukan",
		notFoundHint: "Periksa tautannya, atau tanyakan kode kelas ke tutormu.",
		closed: "Umpan balik belum dibuka",
		closedHint: "menerima umpan balik setelah kelas selesai.",
		thanks: "Terima kasih!",
		thanksHint: "Umpan balikmu terkirim secara anonim.",
		cont: "Lanjut ke kelasmu",
		dup: "Email ini sudah mengirim umpan balik untuk kelas ini.",
		required: "wajib",
	},
	en: {
		tag: "Class feedback",
		with: "with",
		anon: "Anonymous: your email is only used to stop a second submission and is never stored with your answers.",
		email: "Email",
		delivery: "Delivery of the material",
		interactive: "Interactivity",
		learnAgain: "Wanting to learn with this tutor again",
		low: "Poor",
		high: "Excellent",
		progress: "answered",
		yourEmail: "Your email",
		unclear:
			"Which topics did you not understand yet and want covered in the next tutorial?",
		message: "What are your impressions and advice so the tutor can improve?",
		send: "Send",
		of5: "of 5",
		notFound: "Form not found",
		notFoundHint: "Check the link, or ask your tutor for the class code.",
		closed: "Feedback is not open yet",
		closedHint: "takes feedback once the class is done.",
		thanks: "Thank you!",
		thanksHint: "Your feedback was sent anonymously.",
		cont: "Continue to your class",
		dup: "This email already sent feedback for this class.",
		required: "required",
	},
} as const;

function Shell({
	lang,
	setLang,
	children,
}: {
	lang: Lang;
	setLang: (l: Lang) => void;
	children: React.ReactNode;
}) {
	return (
		<main className="min-h-screen bg-gray-100 px-4 py-10">
			<div className="mx-auto max-w-xl">
				<fieldset className="mb-3 flex justify-end gap-1">
					<legend className="sr-only">Language</legend>
					{(["id", "en"] as const).map((l) => (
						<button
							key={l}
							type="button"
							aria-pressed={lang === l}
							onClick={() => setLang(l)}
							className={`rounded-md px-3 py-1 text-xs font-semibold uppercase focus-visible:outline-2 focus-visible:outline-brand-600 ${
								lang === l
									? "bg-brand-700 text-white"
									: "border border-[#d8e0f0] bg-white text-gray-600 hover:bg-gray-50"
							}`}
						>
							{l}
						</button>
					))}
				</fieldset>
				{children}
			</div>
		</main>
	);
}

function Card({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-xl border border-[#d8e0f0] bg-white p-6">
			{children}
		</div>
	);
}

function Question({
	n,
	label,
	required,
	children,
}: {
	n: number;
	label: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<section className="flex gap-4 rounded-xl border border-[#d8e0f0] bg-white p-5 sm:p-6">
			<span
				aria-hidden
				className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700"
			>
				{n}
			</span>
			<div className="flex min-w-0 flex-1 flex-col gap-3">
				<div className="text-[15px] font-semibold leading-snug text-gray-900">
					{label}
					{required && <span className="ml-1 text-red-600">*</span>}
				</div>
				{children}
			</div>
		</section>
	);
}

function Scale({
	name,
	low,
	high,
	of5,
	value,
	onChange,
}: {
	name: string;
	low: string;
	high: string;
	of5: string;
	value: number;
	onChange: (n: number) => void;
}) {
	return (
		<fieldset>
			<legend className="sr-only">{name}</legend>
			<div className="flex gap-1.5">
				{[1, 2, 3, 4, 5].map((n) => (
					<button
						key={n}
						type="button"
						aria-label={`${n} ${of5}`}
						aria-pressed={value === n}
						onClick={() => onChange(n)}
						className="rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
					>
						<Star
							size={36}
							aria-hidden
							className={
								n <= value
									? "fill-amber-400 text-amber-400"
									: "text-gray-300 hover:text-amber-300"
							}
						/>
					</button>
				))}
			</div>
			<div className="mt-1.5 flex justify-between text-xs text-gray-500">
				<span>1 · {low}</span>
				<span>{high} · 5</span>
			</div>
		</fieldset>
	);
}

const field =
	"w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30";

export default function FeedbackForm({
	code,
	from,
}: {
	code: string;
	from?: string;
}) {
	const user = useAuthStore.useUser();
	const [lang, setLang] = useState<Lang>("id");
	const t = T[lang];
	const info = useQuery({
		queryKey: ["feedback-form", code],
		queryFn: () => fetchFeedbackForm(code),
		retry: false,
	});

	const [email, setEmail] = useState("");
	const [delivery, setDelivery] = useState(0);
	const [interactive, setInteractive] = useState(0);
	const [learnAgain, setLearnAgain] = useState(0);
	const [unclear, setUnclear] = useState("");
	const [message, setMessage] = useState("");

	const shownEmail = email || user?.email || "";
	const send = useMutation({
		mutationFn: () =>
			submitFeedback(code, {
				email: shownEmail.trim(),
				delivery_rating: delivery,
				interactive_rating: interactive,
				learn_again_rating: learnAgain,
				unclear_topics: unclear,
				message,
			}),
	});

	const ready =
		shownEmail.includes("@") &&
		delivery > 0 &&
		interactive > 0 &&
		learnAgain > 0 &&
		unclear.trim() !== "" &&
		message.trim() !== "";
	const shell = (children: React.ReactNode) => (
		<Shell lang={lang} setLang={setLang}>
			{children}
		</Shell>
	);

	if (info.isLoading) {
		return shell(<div className="h-64 animate-pulse rounded-xl bg-gray-100" />);
	}
	if (info.isError || !info.data) {
		return shell(
			<Card>
				<Typography weight="semibold" className="text-lg text-gray-900">
					{t.notFound}
				</Typography>
				<p className="mt-1 text-sm text-gray-500">{t.notFoundHint}</p>
			</Card>,
		);
	}
	if (!info.data.open) {
		return shell(
			<Card>
				<Typography weight="semibold" className="text-lg text-gray-900">
					{t.closed}
				</Typography>
				<p className="mt-1 text-sm text-gray-500">
					{info.data.tutorial_name} {t.closedHint}
				</p>
			</Card>,
		);
	}
	if (send.isSuccess) {
		return shell(
			<Card>
				<Typography weight="semibold" className="text-lg text-gray-900">
					{t.thanks}
				</Typography>
				<p className="mt-1 text-sm text-gray-500">{t.thanksHint}</p>
				{user && (
					<Link
						href={
							from
								? `${PATH.STUDENT_TUTORIALS}/${from}`
								: PATH.STUDENT_TUTORIALS
						}
						className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
					>
						{t.cont}
					</Link>
				)}
			</Card>,
		);
	}

	const duplicate = send.error instanceof ApiError && send.error.status === 409;

	const rated = [
		delivery > 0,
		interactive > 0,
		learnAgain > 0,
		unclear.trim() !== "",
		message.trim() !== "",
	].filter(Boolean).length;

	return shell(
		<>
			<header className="bg-graph relative mb-5 overflow-hidden rounded-xl border border-[#d8e0f0] bg-white px-6 py-7 pl-8">
				<span
					aria-hidden
					className="absolute inset-y-0 left-0 w-1.5 bg-brand-600"
				/>
				<p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
					{t.tag}
				</p>
				<Typography
					as="h1"
					weight="bold"
					className="mt-1 text-3xl leading-tight text-brand-950"
				>
					{info.data.tutorial_name}
				</Typography>
				{info.data.tutor_name && (
					<p className="mt-1 text-sm text-gray-700">
						{t.with} {info.data.tutor_name}
					</p>
				)}
				<p className="mt-4 flex items-start gap-2 text-xs text-gray-600">
					<Lock size={14} aria-hidden className="mt-px shrink-0" />
					{t.anon}
				</p>
			</header>

			<form
				className="flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					if (ready) send.mutate();
				}}
			>
				<section className="rounded-xl border border-[#d8e0f0] bg-white p-5 sm:p-6">
					<label className="flex flex-col gap-1.5 text-[15px] font-semibold text-gray-900">
						<span>
							{t.yourEmail} <span className="text-red-600">*</span>
						</span>
						<input
							type="email"
							value={shownEmail}
							onChange={(e) => setEmail(e.target.value)}
							readOnly={Boolean(user?.email)}
							autoComplete="email"
							placeholder="nama@email.com"
							className={`${field} font-normal read-only:bg-gray-50`}
						/>
					</label>
				</section>

				<Question n={1} label={t.delivery} required>
					<Scale
						name={t.delivery}
						low={t.low}
						high={t.high}
						of5={t.of5}
						value={delivery}
						onChange={setDelivery}
					/>
				</Question>
				<Question n={2} label={t.interactive} required>
					<Scale
						name={t.interactive}
						low={t.low}
						high={t.high}
						of5={t.of5}
						value={interactive}
						onChange={setInteractive}
					/>
				</Question>
				<Question n={3} label={t.learnAgain} required>
					<Scale
						name={t.learnAgain}
						low={t.low}
						high={t.high}
						of5={t.of5}
						value={learnAgain}
						onChange={setLearnAgain}
					/>
				</Question>
				<Question n={4} label={t.unclear} required>
					<textarea
						aria-label={t.unclear}
						value={unclear}
						onChange={(e) => setUnclear(e.target.value)}
						maxLength={2000}
						rows={4}
						className={field}
					/>
				</Question>
				<Question n={5} label={t.message} required>
					<textarea
						aria-label={t.message}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						maxLength={2000}
						rows={4}
						className={field}
					/>
				</Question>

				{send.isError && (
					<p
						role="alert"
						className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
					>
						{duplicate ? t.dup : send.error.message}
					</p>
				)}

				<div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-[#d8e0f0] bg-white/90 px-4 py-3 backdrop-blur">
					<div className="min-w-0 flex-1">
						<div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
							<div
								className="h-full rounded-full bg-brand-600 transition-all"
								style={{ width: `${(rated / 5) * 100}%` }}
							/>
						</div>
						<p className="mt-1 text-xs tabular-nums text-gray-500">
							{rated}/5 {t.progress}
						</p>
					</div>
					<Button
						type="submit"
						variant="brand"
						isLoading={send.isPending}
						disabled={!ready}
					>
						{t.send}
					</Button>
				</div>
			</form>
		</>,
	);
}
