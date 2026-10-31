/**
 * The live loop on the harness drawing (runLoop() in
 * docs/reference/harness-hero-demo.html): an event comes in, orchestration
 * reads the ontology and policy, the action passes the guardrails, Customer
 * 360 is updated, and the outcome loops back. Dots travel the drawing's
 * paths (getPointAtLength, as AgenticFlowDemo's StageLine does); boxes and
 * chips flash. Only transform and opacity change.
 *
 * Built so slow phones keep up. Every frame the page itself has to draw is
 * expensive there, whatever changed, so the loop asks for as few as it can:
 * - the dots, the flashes and the glow are plain elements on their own layer
 *   above the SVG, run by the browser's animation thread, with no page frames
 *   while they play. Anything animated inside an SVG cannot run there. Each
 *   path's points are worked out once and reused;
 * - the event swap, the one fade left inside the SVG, updates about 20 times
 *   a second rather than on every frame.
 *
 * The swap and the waits run on one clock that moves only while the loop
 * plays, and the animations pause with it, so pause() freezes everything
 * together and play() picks up where it left off. useLoopWhileVisible plays it only at
 * level on and only while it is on screen; a hidden browser tab pauses it
 * too. destroy() stops the clock and the dots and removes them.
 */

export type LoopTexts = {
  events: string[]
  actions: string[]
  fields: string[]
}

export type LoopOptions = {
  /** Every duration is multiplied by this: 1 normal, more is slower. */
  pace: number
  /** False runs one cycle, then stops. */
  repeat: boolean
  /** The status line: a step name and what happens, or null to leave it. */
  status: (step: string, detail: string) => void
}

type Tween = { start: number; duration: number; frame: (k: number) => void; done: () => void }
type Timer = { at: number; done: () => void }

/** Points worked out along a path, the dot's position read between them. */
const PATH_SAMPLES = 48
/** Steps of a dot's journey handed to the browser: enough to hold the path's corners and the easing. */
const DOT_STEPS = 40
/** How often the fades and waits move, in ms. */
const TICK_MS = 50
/** The dot's size in the drawing's own units: the core's radius and the soft ring around it. */
const DOT_RADIUS = 4.4
const DOT_RING = 4.6
const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2)

/** The status line's words for each step. */
export const STEP = {
  event: (e: string) => ['Event in', e] as const,
  orchestration: ['Orchestration', 'Reading ontology and policy'] as const,
  passed: (a: string) => ['Guardrails', `Passed, agent runs ${a}`] as const,
  handover: ['Guardrails', 'Outside policy, so your team steps in'] as const,
  record: (f: string) => ['Customer 360', `Updating ${f}`] as const,
  learning: ['Learning loop', 'Outcome feeds back into ontology and policy'] as const,
}

/** What one cycle does: its event, whether it hands over, its action and its chip. */
export const cyclePlan = (cycle: number, texts: LoopTexts) => {
  const handover = cycle % 3 === 2
  // Actions take turns over the cycles that do not hand over.
  const runs = cycle - Math.floor((cycle + 1) / 3)
  return {
    event: texts.events.length ? texts.events[cycle % texts.events.length] : '',
    handover,
    action: handover ? texts.actions.length : runs % Math.max(1, texts.actions.length),
    field: texts.fields.length ? cycle % texts.fields.length : -1,
  }
}

export class HarnessLoop {
  private clock = 0
  private last = 0
  private ticker: ReturnType<typeof setTimeout> | undefined
  private motions = new Set<Animation>()
  private playing = false
  private hidden = false
  private destroyed = false
  private tweens = new Set<Tween>()
  private timers = new Set<Timer>()
  private cycle = 0
  private started = false
  private readonly samples = new Map<string, { x: number; y: number }[]>()
  private readonly onVisibility = () => {
    this.hidden = document.hidden
    this.schedule()
  }

  constructor(
    private readonly svg: SVGSVGElement,
    /** The layer above the SVG that holds the dots, the same size and place as the drawing. */
    private readonly layer: HTMLElement,
    private readonly texts: LoopTexts,
    private readonly options: LoopOptions,
  ) {
    this.hidden = typeof document !== 'undefined' && document.hidden
    document.addEventListener('visibilitychange', this.onVisibility)
  }

  play() {
    if (this.destroyed) return
    this.playing = true
    if (!this.started) {
      this.started = true
      void this.run()
    }
    this.schedule()
  }

  pause() {
    this.playing = false
    this.schedule()
  }

  destroy() {
    this.destroyed = true
    this.playing = false
    clearTimeout(this.ticker)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.tweens.clear()
    this.timers.clear()
    for (const motion of this.motions) {
      motion.onfinish = null
      motion.cancel()
    }
    this.motions.clear()
    this.layer.replaceChildren()
    const event = this.k('event')
    if (event) event.style.opacity = ''
  }

  /* The clock */

  private running() {
    return this.playing && !this.hidden && !this.destroyed
  }

  private schedule() {
    clearTimeout(this.ticker)
    this.ticker = undefined
    const running = this.running()
    for (const motion of this.motions) {
      if (running) motion.play()
      else motion.pause()
    }
    this.arm()
  }

  /** Wakes the clock only when something is due: often during the swap, otherwise at the next wait's end, otherwise not at all. */
  private arm() {
    if (this.ticker !== undefined || !this.running()) return
    const due = this.tweens.size ? TICK_MS : this.timers.size ? Math.min(...[...this.timers].map((t) => t.at)) - this.clock : null
    if (due === null) return
    this.last = performance.now()
    this.ticker = setTimeout(this.tick, Math.max(0, due))
  }

  private readonly tick = () => {
    this.ticker = undefined
    this.clock += performance.now() - this.last
    for (const t of [...this.tweens]) {
      const k = Math.min(1, (this.clock - t.start) / t.duration)
      t.frame(k)
      if (k >= 1) {
        this.tweens.delete(t)
        t.done()
      }
    }
    for (const t of [...this.timers]) {
      if (this.clock >= t.at) {
        this.timers.delete(t)
        t.done()
      }
    }
    this.arm()
  }

  /** Something new is due: bring the clock up to now, then wake it for the soonest thing. */
  private rearm() {
    if (this.ticker !== undefined) {
      clearTimeout(this.ticker)
      this.ticker = undefined
      this.clock += performance.now() - this.last
    }
    this.arm()
  }

  private wait(ms: number) {
    return new Promise<void>((done) => {
      this.timers.add({ at: this.clock + ms * this.options.pace, done })
      this.rearm()
    })
  }

  private tween(ms: number, frame: (k: number) => void) {
    return new Promise<void>((done) => {
      frame(0)
      this.tweens.add({ start: this.clock, duration: Math.max(1, ms * this.options.pace), frame, done })
      this.rearm()
    })
  }

  /* The drawing */

  private k(key: string) {
    return this.svg.querySelector<SVGGraphicsElement>(`[data-k="${key}"]`)
  }

  /** A path's points, worked out the first time a dot runs it. */
  private points(key: string) {
    const known = this.samples.get(key)
    if (known) return known
    const path = this.k(key) as SVGPathElement | null
    if (!path || typeof path.getTotalLength !== 'function') return null
    const length = path.getTotalLength()
    const points = Array.from({ length: PATH_SAMPLES + 1 }, (_, i) => {
      const p = path.getPointAtLength((i / PATH_SAMPLES) * length)
      return { x: p.x, y: p.y }
    })
    this.samples.set(key, points)
    return points
  }

  /** A dot along a path, then gone. Teal for the learning loop. */
  private dot(key: string, ms: number, teal = false) {
    const points = this.points(key)
    if (!points) return Promise.resolve()
    // Drawing units to the drawing's size on screen, taken as the dot sets off.
    const scale = this.svg.getBoundingClientRect().width / (this.svg.viewBox.baseVal.width || 1)
    const radius = DOT_RADIUS * scale
    const el = document.createElement('span')
    el.className = `hh-dot${teal ? ' teal' : ''}`
    el.style.width = el.style.height = `${radius * 2}px`
    el.style.setProperty('--hh-dot-ring', `${DOT_RING * scale}px`)
    this.layer.appendChild(el)
    const steps = Array.from({ length: DOT_STEPS + 1 }, (_, s) => {
      const at = ease(s / DOT_STEPS) * PATH_SAMPLES
      const i = Math.min(Math.floor(at), PATH_SAMPLES - 1)
      const f = at - i
      const x = points[i].x + (points[i + 1].x - points[i].x) * f
      const y = points[i].y + (points[i + 1].y - points[i].y) * f
      return { transform: `translate3d(${x * scale - radius}px,${y * scale - radius}px,0)` }
    })
    return this.animateOnLayer(el, steps, ms, 'linear')
  }

  /** Plays an element on the layer's animation, then removes it. Pauses and resumes with the loop. */
  private animateOnLayer(el: HTMLElement, steps: Keyframe[], ms: number, easing: string) {
    const motion = el.animate(steps, { duration: Math.max(1, ms * this.options.pace), easing, fill: 'forwards' })
    this.motions.add(motion)
    if (!this.running()) motion.pause()
    return new Promise<void>((done) => {
      motion.onfinish = () => {
        this.motions.delete(motion)
        el.remove()
        done()
      }
    })
  }

  /** An element on the layer exactly over a part of the drawing, with that part's rounded corners. */
  private over(target: SVGGraphicsElement, className: string) {
    const box = target.getBoundingClientRect()
    const at = this.layer.getBoundingClientRect()
    const scale = at.width / (this.svg.viewBox.baseVal.width || 1)
    const el = document.createElement('span')
    el.className = className
    el.style.left = `${box.left - at.left}px`
    el.style.top = `${box.top - at.top}px`
    el.style.width = `${box.width}px`
    el.style.height = `${box.height}px`
    const rx = Number(target.getAttribute('rx'))
    el.style.borderRadius = target.tagName === 'circle' ? '50%' : `${(rx || 0) * scale}px`
    this.layer.appendChild(el)
    return el
  }

  /** A flash: up to its peak, held, then gone (the reference's flash()). A dimmed part flashes dimmed. */
  private flash(key: string, ms: number, peak = 1) {
    const target = this.k(key)
    if (!target) return
    const kind = target.classList.contains('chk-f') ? 'check' : target.classList.contains('loop-bg') ? 'loop' : 'box'
    const top = peak * (target.closest('.dim') ? 0.35 : 1)
    const el = this.over(target, `hh-flash hh-flash--${kind}`)
    void this.animateOnLayer(el, [{ opacity: 0 }, { opacity: top, offset: 0.25 }, { opacity: top, offset: 0.6 }, { opacity: 0 }], ms, 'ease-out')
  }

  /** Orchestration's short crimson glow. */
  private glow(ms: number) {
    const target = this.k('halo')
    if (!target) return
    const el = this.over(target, 'hh-glow')
    void this.animateOnLayer(
      el,
      [
        { opacity: 0, transform: 'scale(1)' },
        { opacity: 0.8, transform: 'scale(1.02)', offset: 0.3 },
        { opacity: 0, transform: 'scale(1.07)' },
      ],
      ms,
      'ease-out',
    )
  }

  /** The event card fades to the next event. */
  private async swap(text: string) {
    const el = this.k('event')
    if (!el || el.textContent === text) return
    await this.tween(220, (k) => {
      el.style.opacity = String(1 - k)
    })
    el.textContent = text
    void this.tween(260, (k) => {
      el.style.opacity = String(k)
    })
  }

  /* The sequence */

  private alive() {
    return !this.destroyed
  }

  private async run() {
    const portrait = this.svg.dataset.layout === 'portrait'
    while (this.alive()) {
      const plan = cyclePlan(this.cycle, this.texts)

      // 1. A customer event comes in.
      this.options.status(...STEP.event(plan.event))
      await this.swap(plan.event)
      await this.dot('trigger', 1100)
      if (!this.alive()) break

      // 2. Orchestration reads the ontology and policy.
      this.options.status(...STEP.orchestration)
      this.glow(1300)
      await Promise.all([this.dot('ontology', 950), this.dot('policy', 1050)])
      if (!this.alive()) break
      await this.wait(200)

      // 3. Through the guardrails to an action, or to the team.
      const i = plan.action
      const [gate, outcome] = plan.handover ? STEP.handover : STEP.passed(this.texts.actions[i] ?? '')
      this.options.status(gate, outcome)
      const checks = this.svg.querySelectorAll('[data-k^="check-"]').length
      void this.wait(portrait ? 330 : 620).then(() => this.alive() && this.flash(`check-${Math.min(i, checks - 1)}`, 700, 0.9))
      await this.dot(`act-${i}`, 1200)
      if (!this.alive()) break
      this.flash(`action-${i}`, 1300)
      await this.wait(350)

      // 4. Customer 360 is updated, one chip at a time.
      if (plan.field >= 0) this.options.status(...STEP.record(this.texts.fields[plan.field]))
      await this.dot(`out-${i}`, 1050)
      if (!this.alive()) break
      if (plan.field >= 0) this.flash(`field-${plan.field}`, 1300)
      await this.wait(250)

      // 5. The outcome feeds back.
      this.options.status(...STEP.learning)
      this.flash('loopBg', 1800)
      await this.dot('loop', 1700, true)
      if (!this.alive()) break
      await this.wait(900)
      this.cycle += 1
      if (!this.options.repeat) {
        this.pause()
        break
      }
    }
  }
}
