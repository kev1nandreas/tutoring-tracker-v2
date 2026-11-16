"use client";

import Dialog from "@mui/material/Dialog";
import { Maximize, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
	/** YouTube video id, or null while closed. */
	videoId: string | null;
	title: string;
	onClose: () => void;
};

const YT_ORIGIN = "https://www.youtube-nocookie.com";
const PLAYING = 1;

// Built only from an 11-character id, never from a link. Nocookie host, no related
// videos, no annotations. YouTube's own controls, keyboard and fullscreen are off: the
// app draws its own. autoplay=1 starts the video when the modal opens (the click that
// opened it counts as the user's permission).
const embedUrl = (id: string) =>
	`${YT_ORIGIN}/embed/${encodeURIComponent(id)}?autoplay=1&controls=0&disablekb=1&fs=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;

const clock = (s: number) => {
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = String(s % 60).padStart(2, "0");
	return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

const noMenu = (e: React.MouseEvent) => e.preventDefault();

type PlayerInfo = {
	playerState?: number;
	currentTime?: number;
	duration?: number;
	muted?: boolean;
};

/**
 * The player. The iframe cannot be clicked and a transparent layer covers it, so a
 * right-click never reaches YouTube's menu ("Copy video URL", "Watch on YouTube").
 * Play, seek, mute and fullscreen are our own controls, sent to the player with
 * postMessage. Mounted with key={videoId}, so every video starts from a clean state.
 */
function Player({ videoId, title }: { videoId: string; title: string }) {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(false);
	const [time, setTime] = useState(0); // whole seconds, so it re-renders once a second
	const [duration, setDuration] = useState(0);

	const post = useCallback((payload: object) => {
		frameRef.current?.contentWindow?.postMessage(
			JSON.stringify(payload),
			YT_ORIGIN,
		);
	}, []);
	const command = useCallback(
		(func: string, args: unknown[] = []) =>
			post({ event: "command", func, args }),
		[post],
	);

	// Player -> app. The player only answers after it has loaded, and it ignores a
	// "listening" sent too early, so ask repeatedly until the first answer arrives.
	useEffect(() => {
		let ready = false;
		const ask = () => post({ event: "listening", id: 1, channel: "widget" });
		const timer = setInterval(
			() => (ready ? clearInterval(timer) : ask()),
			300,
		);

		const onMessage = (e: MessageEvent) => {
			if (e.source !== frameRef.current?.contentWindow) return;
			if (typeof e.data !== "string") return;
			let msg: { event?: string; info?: PlayerInfo };
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			ready = true;
			if (msg.event !== "infoDelivery" || !msg.info) return;
			const { playerState, currentTime, duration, muted } = msg.info;
			if (playerState !== undefined) setPlaying(playerState === PLAYING);
			if (currentTime !== undefined) setTime(Math.floor(currentTime));
			if (duration) setDuration(Math.floor(duration));
			if (muted !== undefined) setMuted(muted);
		};

		window.addEventListener("message", onMessage);
		return () => {
			clearInterval(timer);
			window.removeEventListener("message", onMessage);
		};
	}, [post]);

	const toggle = () => command(playing ? "pauseVideo" : "playVideo");
	const toggleMute = () => command(muted ? "unMute" : "mute");
	const fullscreen = () => {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void stageRef.current?.requestFullscreen?.();
	};
	const seek = (to: number) => {
		setTime(to);
		command("seekTo", [to, true]);
	};

	const btn =
		"rounded-md p-1.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white";

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: only blocks the context menu
		<div
			ref={stageRef}
			role="presentation"
			className="relative aspect-video w-full bg-black select-none"
			onContextMenu={noMenu}
		>
			<iframe
				ref={frameRef}
				src={embedUrl(videoId)}
				title={`Recording: ${title}`}
				className="pointer-events-none absolute inset-0 h-full w-full border-0"
				sandbox="allow-scripts allow-same-origin allow-presentation"
				allow="autoplay; encrypted-media; picture-in-picture"
				referrerPolicy="strict-origin-when-cross-origin"
				tabIndex={-1}
			/>

			{/* catches clicks and right-clicks; click = play / pause */}
			<button
				type="button"
				aria-label={playing ? "Pause" : "Play"}
				onClick={toggle}
				className="absolute inset-0 cursor-pointer"
			/>

			<div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-linear-to-t from-black/80 to-transparent px-3 pt-8 pb-2 text-white">
				<button
					type="button"
					onClick={toggle}
					aria-label={playing ? "Pause" : "Play"}
					className={btn}
				>
					{playing ? (
						<Pause size={18} aria-hidden />
					) : (
						<Play size={18} aria-hidden />
					)}
				</button>
				<span className="w-24 shrink-0 text-xs tabular-nums">
					{clock(time)} / {clock(duration)}
				</span>
				<input
					type="range"
					min={0}
					max={duration || 1}
					step={1}
					value={Math.min(time, duration || 1)}
					onChange={(e) => seek(Number(e.target.value))}
					aria-label="Seek"
					className="h-1 min-w-0 flex-1 cursor-pointer accent-white"
				/>
				<button
					type="button"
					onClick={toggleMute}
					aria-label={muted ? "Unmute" : "Mute"}
					className={btn}
				>
					{muted ? (
						<VolumeX size={18} aria-hidden />
					) : (
						<Volume2 size={18} aria-hidden />
					)}
				</button>
				<button
					type="button"
					onClick={fullscreen}
					aria-label="Fullscreen"
					className={btn}
				>
					<Maximize size={18} aria-hidden />
				</button>
			</div>
		</div>
	);
}

/** Plays a recording inside the app, without a way to open it on youtube.com. */
export default function VideoModal({ videoId, title, onClose }: Props) {
	return (
		<Dialog
			open={videoId !== null}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			slotProps={{
				paper: {
					sx: { overflow: "hidden", bgcolor: "#000" },
					onContextMenu: noMenu,
				},
			}}
			onContextMenu={noMenu}
		>
			<div className="flex items-center justify-between gap-3 bg-gray-900 px-4 py-2.5">
				<p className="truncate text-sm font-medium text-white">{title}</p>
				<button
					type="button"
					onClick={onClose}
					aria-label="Close video"
					className="shrink-0 rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
				>
					<X size={18} aria-hidden />
				</button>
			</div>
			{videoId && <Player key={videoId} videoId={videoId} title={title} />}
		</Dialog>
	);
}
