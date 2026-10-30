/**
 * The live loop on the harness drawing (runLoop() in
 * docs/reference/harness-hero-demo.html): an event comes in, orchestration
 * reads the ontology and policy, the action passes the guardrails, Customer
 * 360 is updated, and the outcome loops back. Dots travel the drawing's
 * paths (getPointAtLength, as AgenticFlowDemo's StageLine does); boxes and
 * chips flash. Only transform and opacity change.
 *
 * Everything runs on one clock that moves only while the loop plays, so
 * pause() freezes the dots, the flashes and the waits together, and play()
 * picks up where it left off. useLoopWhileVisible plays it only at level on
 * and only while it is on screen; a hidden browser tab pauses it too.
 * destroy() stops every frame and removes the dots.
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

const NS = 'http://www.w3.org/2000/svg'
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
  private frame = 0
  private playing = false
  private hidden = false
  private destroyed = false
  private tweens = new Set<Tween>()
  private timers = new Set<Timer>()
  private cycle = 0
  private started = false
  private readonly onVisibility = () => {
    this.hidden = document.hidden
    this.schedule()
  }

  constructor(
    private readonly svg: SVGSVGElement,
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
    cancelAnimationFrame(this.frame)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.tweens.clear()
    this.timers.clear()
    this.layer()?.replaceChildren()
    for (const el of this.svg.querySelectorAll<SVGElement>('.flash, .chk-f, .halo, .loop-bg')) {
      el.style.opacity = ''
      el.style.transform = ''
    }
    const event = this.k('event')
    if (event) event.style.opacity = ''
  }

  /* The clock */

  private schedule() {
    cancelAnimationFrame(this.frame)
    if (this.playing && !this.hidden && !this.destroyed) {
      this.last = performance.now()
      this.frame = requestAnimationFrame(this.tick)
    }
  }

  private readonly tick = (now: number) => {
    this.clock += Math.min(now - this.last, 100)
    this.last = now
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
    if (this.playing && !this.hidden && !this.destroyed) this.frame = requestAnimationFrame(this.tick)
  }

  private wait(ms: number) {
    return new Promise<void>((done) => this.timers.add({ at: this.clock + ms * this.options.pace, done }))
  }

  private tween(ms: number, frame: (k: number) => void) {
    return new Promise<void>((done) => {
      frame(0)
      this.tweens.add({ start: this.clock, duration: Math.max(1, ms * this.options.pace), frame, done })
    })
  }

  /* The drawing */

  private k(key: string) {
    return this.svg.querySelector<SVGGraphicsElement>(`[data-k="${key}"]`)
  }

  private layer() {
    return this.svg.querySelector<SVGGElement>('.hh-dots')
  }

  /** A dot along a path, then gone. Teal for the learning loop. */
  private dot(key: string, ms: number, teal = false) {
    const path = this.k(key) as SVGPathElement | null
    const layer = this.layer()
    if (!path || !layer || typeof path.getTotalLength !== 'function') return Promise.resolve()
    const len = path.getTotalLength()
    const g = document.createElementNS(NS, 'g')
    g.setAttribute('class', `dot${teal ? ' teal' : ''}`)
    for (const [r, cls] of [
      [9, 'dot-halo'],
      [4.4, 'dot-core'],
    ] as const) {
      const c = document.createElementNS(NS, 'circle')
      c.setAttribute('r', String(r))
      c.setAttribute('class', cls)
      g.appendChild(c)
    }
    layer.appendChild(g)
    return this.tween(ms, (k) => {
      const pt = path.getPointAtLength(ease(k) * len)
      g.style.transform = `translate(${pt.x}px, ${pt.y}px)`
    }).then(() => g.remove())
  }

  /** A flash: up to its peak, held, then gone (the reference's flash()). */
  private flash(key: string, ms: number, peak = 1) {
    const el = this.k(key)
    if (!el) return
    void this.tween(ms, (k) => {
      el.style.opacity = String(k < 0.25 ? (k / 0.25) * peak : k < 0.6 ? peak : ((1 - k) / 0.4) * peak)
    })
  }

  /** Orchestration's short crimson glow. */
  private glow(ms: number) {
    const el = this.k('halo')
    if (!el) return
    void this.tween(ms, (k) => {
      const a = k < 0.3 ? (k / 0.3) * 0.8 : 0.8 * (1 - (k - 0.3) / 0.7)
      el.style.opacity = String(Math.max(0, a))
      el.style.transform = `scale(${k < 0.3 ? 1 + (k / 0.3) * 0.02 : 1.02 + ((k - 0.3) / 0.7) * 0.05})`
    })
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
