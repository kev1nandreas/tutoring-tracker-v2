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

// Built only from an 11-character id, never from a link. Nocookie host, no
// related videos, little branding, no annotations. YouTube's own controls,
// keyboard and fullscreen button are off: the app draws its own (see below).
const embedUrl = (id: string, origin: string) =>
	`${YT_ORIGIN}/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&controls=0&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`;

const PLAYING = 1;

const clock = (s: number) => {
	if (!Number.isFinite(s) || s < 0) return "0:00";
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const sec = Math.floor(s % 60)
		.toString()
		.padStart(2, "0");
	return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

const noMenu = (e: React.MouseEvent) => e.preventDefault();

/**
 * Plays a recording inside the app.
 *
 * The iframe cannot be clicked (pointer-events: none) and a transparent layer sits on
 * top, so a right-click never reaches YouTube's menu ("Copy video URL", "Watch on
 * YouTube"). Play, seek, volume and fullscreen are our own controls that talk to the
 * player through its postMessage API. The iframe is also sandboxed WITHOUT
 * allow-popups and allow-top-navigation. (Anyone determined can still find the video
 * id in the network tab; this stops the casual route, not a developer.)
 */
export default function VideoModal({ videoId, title, onClose }: Props) {
	const frameRef = useRef<HTMLIFrameElement>(null);
	const stageRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(false);
	const [time, setTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [origin, setOrigin] = useState("");

	useEffect(() => setOrigin(window.location.origin), []);

	const send = useCallback((func: string, args: unknown[] = []) => {
		frameRef.current?.contentWindow?.postMessage(
			JSON.stringify({ event: "command", func, args }),
			YT_ORIGIN,
		);
	}, []);

	// reset when another video opens
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on id change only
	useEffect(() => {
		setPlaying(false);
		setMuted(false);
		setTime(0);
		setDuration(0);
	}, [videoId]);

	// player -> app: state, time, duration, mute
	useEffect(() => {
		if (!videoId) return;
		const onMessage = (e: MessageEvent) => {
			if (e.origin !== YT_ORIGIN || typeof e.data !== "string") return;
			let msg: { event?: string; info?: unknown };
			try {
				msg = JSON.parse(e.data);
			} catch {
				return;
			}
			if (msg.event === "onStateChange" && typeof msg.info === "number") {
				setPlaying(msg.info === PLAYING);
			} else if (msg.event === "infoDelivery" && msg.info) {
				const info = msg.info as {
					playerState?: number;
					currentTime?: number;
					duration?: number;
					muted?: boolean;
				};
				if (info.playerState !== undefined)
					setPlaying(info.playerState === PLAYING);
				if (info.currentTime !== undefined) setTime(info.currentTime);
				if (info.duration) setDuration(info.duration);
				if (info.muted !== undefined) setMuted(info.muted);
			}
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, [videoId]);

	// ask the player to start reporting once it has loaded
	const listen = () => {
		frameRef.current?.contentWindow?.postMessage(
			JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
			YT_ORIGIN,
		);
	};

	const toggle = () => send(playing ? "pauseVideo" : "playVideo");
	const toggleMute = () => {
		send(muted ? "unMute" : "mute");
		setMuted(!muted);
	};
	const fullscreen = () => {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void stageRef.current?.requestFullscreen?.();
	};

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
			// the backdrop is outside the paper
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

			{/* biome-ignore lint/a11y/noStaticElementInteractions: only blocks the context menu */}
			<div
				ref={stageRef}
				role="presentation"
				className="relative flex aspect-video w-full flex-col bg-black select-none"
				onContextMenu={noMenu}
			>
				{videoId && origin && (
					<iframe
						ref={frameRef}
						key={videoId}
						src={embedUrl(videoId, origin)}
						title={`Recording: ${title}`}
						className="pointer-events-none absolute inset-0 h-full w-full border-0"
						sandbox="allow-scripts allow-same-origin allow-presentation"
						allow="encrypted-media; picture-in-picture"
						referrerPolicy="strict-origin-when-cross-origin"
						loading="lazy"
						tabIndex={-1}
						onLoad={listen}
					/>
				)}

				{/* catches clicks and right-clicks; click = play / pause */}
				<button
					type="button"
					aria-label={playing ? "Pause" : "Play"}
					onClick={toggle}
					onContextMenu={noMenu}
					className="absolute inset-0 cursor-pointer"
				/>

				{/* biome-ignore lint/a11y/noStaticElementInteractions: only blocks the context menu */}
				<div
					role="presentation"
					className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-3 pt-8 pb-2 text-white"
					onContextMenu={noMenu}
				>
					<button
						type="button"
						onClick={toggle}
						aria-label={playing ? "Pause" : "Play"}
						className="rounded-md p-1.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
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
						onChange={(e) => {
							const to = Number(e.target.value);
							setTime(to);
							send("seekTo", [to, true]);
						}}
						aria-label="Seek"
						className="h-1 min-w-0 flex-1 cursor-pointer accent-white"
					/>

					<button
						type="button"
						onClick={toggleMute}
						aria-label={muted ? "Unmute" : "Mute"}
						className="rounded-md p-1.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
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
						className="rounded-md p-1.5 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-white"
					>
						<Maximize size={18} aria-hidden />
					</button>
				</div>
			</div>
		</Dialog>
	);
}
