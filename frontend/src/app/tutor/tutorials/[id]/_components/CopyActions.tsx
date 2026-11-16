"use client";

import { MessageSquareText } from "lucide-react";
import { feedbackFormPath, PATH } from "@/shared/path";
import type { Tutorial } from "@/types/tutorial";
import CopyButton from "./CopyButton";

const enrollText = (t: Tutorial, origin: string) =>
	`Hai guys👋, untuk tutoring kita di *${t.name}* kita akan pakai tutoring tracker ya supaya bisa lebih nyaman dan efisien. Untuk cara menggunakannya, teman-teman bisa enroll ke kelas dengan cara mudah ini yaa😉:

1. Buka ${origin}${PATH.REGISTER} dan buat akun (atau masuk jika sudah punya akun).
2. Setelah masuk, buka menu *Join a class* (${origin}${PATH.ENROLL})
3. Masukkan kode kelas: *${t.custom_id}*.
4. Klik kirim, lalu tunggu tutor menyetujui permintaanmu.
5. Setelah disetujui, kelas akan muncul di halaman utama kamu.

Kalau ada kendala, kabari ya. Terima kasih!🙌`;

const feedbackText = (t: Tutorial, origin: string) =>
	`Hai guys👋, terima kasih sudah ikut tutoring *${t.name}* selama ${t.meeting_days} hari ini yaww. Semoga ilmunya bermanfaat ya, dan aku minta maaf jika ada kesalahan selama tutoring ini😆.

Untuk evaluasi, aku minta bantuan teman-teman buat isi feedback ini yaa. Tenang aja ini anonim, dan waktu isinya < 2 menit kok. Thank you guyss🙌

${origin}${feedbackFormPath(t.custom_id)}`;

export function CopyEnrollButton({ tutorial }: { tutorial: Tutorial }) {
	return (
		<CopyButton
			label="Copy cara daftar"
			successMessage="Instruksi pendaftaran disalin"
			getText={() => enrollText(tutorial, window.location.origin)}
		/>
	);
}

export function CopyFeedbackButton({ tutorial }: { tutorial: Tutorial }) {
	return (
		<CopyButton
			label="Copy link feedback (WhatsApp)"
			successMessage="Pesan feedback disalin"
			icon={MessageSquareText}
			getText={() => feedbackText(tutorial, window.location.origin)}
		/>
	);
}
