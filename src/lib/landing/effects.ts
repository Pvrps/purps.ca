/** The parts of the landing page drawn and typed in the browser: the guide fairy and the terminal. */

/** A fairy which follows the pointer, and wanders by itself when the pointer is still. Returns how to stop it. */
export function startFairy(canvas: HTMLCanvasElement, reduced: boolean): () => void {
	const context = canvas.getContext('2d')!;
	const mouse = { x: innerWidth / 2, y: innerHeight / 2, t: 0, active: false };
	const fairy = { x: innerWidth * 0.65, y: innerHeight * 0.35 };
	const sparks: { x: number; y: number; vx: number; vy: number; life: number; d: number }[] = [];
	let width = 0;
	let height = 0;
	let request = 0;

	const resize = () => {
		const ratio = Math.min(devicePixelRatio || 1, 2);

		width = innerWidth;
		height = innerHeight;
		canvas.width = width * ratio;
		canvas.height = height * ratio;
		context.setTransform(ratio, 0, 0, ratio, 0, 0);
	};

	const onMove = (e: PointerEvent) => {
		mouse.x = e.clientX;
		mouse.y = e.clientY;
		mouse.t = performance.now();
		mouse.active = true;
	};

	// A click scatters a burst of sparks.
	const onDown = (e: PointerEvent) => {
		for (let i = 0; i < 26; i++) {
			const angle = Math.random() * 6.28;
			const speed = Math.random() * 3.4;

			sparks.push({
				x: e.clientX,
				y: e.clientY,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 0.2,
				life: 1,
				d: 0.012 + Math.random() * 0.02
			});
		}
	};

	const glow = (x: number, y: number, radius: number, rgb: string, alpha: number) => {
		const gradient = context.createRadialGradient(x, y, 0, x, y, radius);

		gradient.addColorStop(0, `rgba(${rgb},${alpha})`);
		gradient.addColorStop(0.35, `rgba(${rgb},${alpha * 0.35})`);
		gradient.addColorStop(1, `rgba(${rgb},0)`);
		context.fillStyle = gradient;
		context.beginPath();
		context.arc(x, y, radius, 0, 6.2832);
		context.fill();
	};

	const wing = (
		x: number,
		y: number,
		turn: number,
		length: number,
		breadth: number,
		flap: number
	) => {
		context.save();
		context.translate(x, y);
		context.rotate(turn);
		context.scale(1, flap);
		context.beginPath();
		context.ellipse(length * 0.55, 0, length * 0.55, breadth, 0, 0, 6.2832);
		context.fillStyle = 'rgba(200,245,255,.28)';
		context.strokeStyle = 'rgba(220,250,255,.75)';
		context.lineWidth = 0.8;
		context.fill();
		context.stroke();
		context.restore();
	};

	let last = performance.now();

	const frame = (now: number) => {
		const dt = Math.min(now - last, 50) / 16.67;
		const t = now / 1000;
		last = now;

		context.clearRect(0, 0, width, height);

		// follows the pointer, wanders on its own when idle
		const idle = !mouse.active || now - mouse.t > 2500;
		const targetX = idle ? width * (0.5 + 0.34 * Math.sin(t * 0.43)) : mouse.x + 26;
		const targetY = idle ? height * (0.3 + 0.14 * Math.sin(t * 0.71 + 1)) : mouse.y - 26;

		fairy.x += (targetX - fairy.x) * 0.055 * dt;
		fairy.y += (targetY - fairy.y) * 0.055 * dt;

		const x = fairy.x;
		const y = fairy.y + Math.sin(t * 3.1) * 5;

		context.globalCompositeOperation = 'lighter';

		if (!reduced && Math.random() < 0.55) {
			sparks.push({
				x,
				y,
				vx: (Math.random() - 0.5) * 0.5,
				vy: Math.random() * 0.6,
				life: 1,
				d: 0.02 + Math.random() * 0.02
			});
		}

		for (let i = sparks.length - 1; i >= 0; i--) {
			const spark = sparks[i];

			spark.x += spark.vx * dt;
			spark.y += spark.vy * dt;
			spark.vy += 0.015 * dt;
			spark.life -= spark.d * dt;

			if (spark.life <= 0) {
				sparks.splice(i, 1);
				continue;
			}

			glow(spark.x, spark.y, 5 * spark.life + 1, '190,240,255', 0.7 * spark.life);
		}

		const flap = reduced ? 0.8 : 0.35 + 0.65 * Math.abs(Math.sin(t * 16));

		context.globalCompositeOperation = 'source-over';
		wing(x, y, -0.55, 19, 5.5, flap);
		wing(x, y, Math.PI + 0.55, 19, 5.5, flap);
		wing(x, y, 0.6, 12, 3.6, flap);
		wing(x, y, Math.PI - 0.6, 12, 3.6, flap);
		context.globalCompositeOperation = 'lighter';
		glow(x, y, 34, '120,220,255', 0.55);
		glow(x, y, 11, '235,252,255', 1);
		context.globalCompositeOperation = 'source-over';

		request = requestAnimationFrame(frame);
	};

	resize();
	addEventListener('resize', resize);
	addEventListener('pointermove', onMove, { passive: true });
	addEventListener('pointerdown', onDown);
	request = requestAnimationFrame(frame);

	return () => {
		cancelAnimationFrame(request);
		removeEventListener('resize', resize);
		removeEventListener('pointermove', onMove);
		removeEventListener('pointerdown', onDown);
	};
}

const escape = (text: string) =>
	text.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
	);

/** Types out what became of the address which was asked for, and keeps a clock. Returns how to stop it. */
export function startTerminal(out: HTMLElement, clock: HTMLElement, reduced: boolean): () => void {
	const host = escape(location.host || 'unknown');
	const path = escape(location.pathname || '/');
	const caret = '<span class="caret"></span>';
	const lines = [
		`<span class="k">&gt;</span> resolve <span class="w">${host}</span>`,
		`<span class="k">&gt;</span> path    <span class="w">${path}</span>`,
		`<span class="k">&gt;</span> exploring the woods for a matching route...`,
		`<span class="e">!</span> no proxy host answers to that name`,
		`<span class="k">&gt;</span> hint: check the address, then try again`
	];

	let timer: ReturnType<typeof setTimeout> | undefined;
	let stopped = false;

	const later = (run: () => void, ms: number) => {
		if (!stopped) timer = setTimeout(run, ms);
	};

	if (reduced) {
		out.innerHTML = lines.join('\n') + '\n' + caret;
	} else {
		let index = 0;
		let done = '';

		const typeLine = () => {
			if (index >= lines.length) {
				out.innerHTML = done + caret;
				return;
			}

			// Typed as plain text, a few letters at a time, and given its colours once the line is complete.
			const plain = document.createElement('div');
			plain.innerHTML = lines[index];

			const text = plain.textContent ?? '';
			let shown = 0;

			const tick = () => {
				shown += 2;

				if (shown >= text.length) {
					done += lines[index] + '\n';
					index++;
					out.innerHTML = done + caret;
					later(typeLine, 320);
					return;
				}

				out.innerHTML = done + escape(text.slice(0, shown)) + caret;
				later(tick, 22);
			};

			tick();
		};

		later(typeLine, 600);
	}

	const tell = () => {
		clock.textContent = new Date().toLocaleTimeString([], { hour12: false });
	};

	tell();
	const ticking = setInterval(tell, 1000);

	return () => {
		stopped = true;
		clearTimeout(timer);
		clearInterval(ticking);
	};
}
