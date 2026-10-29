'use client'

import React, { useRef, useState } from 'react'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  buttonLabel?: string | null
  successMessage?: string | null
  showMessageField?: boolean | null
  /** h1 when the form is the page's first block and the page has no hero (PageView). */
  headingLevel?: 'h1' | 'h2'
}

export const ContactFormBlock: React.FC<Props> = ({
  label,
  heading,
  intro,
  buttonLabel,
  successMessage,
  showMessageField,
  headingLevel = 'h2',
}) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  // Which required fields were empty on the last submit, for aria-invalid.
  const [missing, setMissing] = useState<{ name: boolean; email: boolean }>({ name: false, email: false })
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const [values, setValues] = useState({
    name: '',
    company: '',
    email: '',
    mobile: '',
    message: '',
    website: '', // honeypot — real people never fill this
  })

  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }))

  const submit = async () => {
    if (status === 'sending') return

    const empty = { name: !values.name.trim(), email: !values.email.trim() }
    setMissing(empty)
    if (empty.name || empty.email) {
      setError('Name and business email are required.')
      setStatus('error')
      // To the first empty field, which names the error through aria-describedby.
      ;(empty.name ? nameRef : emailRef).current?.focus()
      return
    }

    // A filled honeypot means a bot. Show success, save nothing.
    if (values.website) {
      setStatus('done')
      return
    }

    setStatus('sending')
    setError('')

    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          company: values.company,
          email: values.email,
          mobile: values.mobile,
          message: values.message,
          sourcePage: typeof window !== 'undefined' ? window.location.pathname : '',
        }),
      })

      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setStatus('done')
    } catch (e) {
      setError('Something went wrong. Please email team@neuroncx.in instead.')
      setStatus('error')
    }
  }

  return (
    <section className="ncx-contact ncx-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500&family=Source+Serif+4:opsz,wght@8..60,400&display=swap');
        .ncx-contact{padding-block:56px;
          font-family:"Source Serif 4",Georgia,serif;color:var(--ncx-ink)}
        .ncx-contact .cols{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
        .ncx-contact .label{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:14px;
          margin:0 0 12px;color:var(--ncx-crimson-ink)}
        .ncx-contact h1,.ncx-contact h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:var(--ncx-heading-max)}
        .ncx-contact .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:46ch;font-size:18px;line-height:1.6}
        /* Was a violet-to-cyan gradient rim showing through a 1px pad. Both
           hues are gone, and inside a highlight the inner surface is
           translucent, so the rim bled across the whole card. A hairline. */
        .ncx-contact .card{border-radius:16px;padding:1px;background:var(--ncx-rule)}
        .ncx-contact .in{background:var(--ncx-white);border-radius:15px;padding:28px 26px}
        .ncx-contact .field{margin-bottom:16px}
        .ncx-contact label{display:block;font-family:"Bricolage Grotesque",system-ui,sans-serif;
          font-size:13px;color:var(--ncx-muted);margin-bottom:6px}
        .ncx-contact input,.ncx-contact textarea{width:100%;font-family:"Source Serif 4",Georgia,serif;
          font-size:16px;color:var(--ncx-ink);background:var(--ncx-paper);
          border:1px solid var(--ncx-rule);border-radius:8px;padding:11px 13px}
        .ncx-contact textarea{min-height:96px;resize:vertical}
        .ncx-contact input:focus,.ncx-contact textarea:focus{outline:2px solid var(--ncx-focus);
          outline-offset:1px;background:var(--ncx-white)}
        .ncx-contact .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
        .ncx-contact button{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:15px;
          font-weight:500;padding:13px 24px;border-radius:8px;border:0;cursor:pointer;
          background:var(--ncx-navy);color:var(--ncx-on-navy);margin-top:4px}
        .ncx-contact button[disabled]{opacity:.6;cursor:default}
        .ncx-contact .err{color:var(--ncx-crimson-ink);font-size:15px;margin:12px 0 0}
        .ncx-contact .err:empty{margin:0}
        .ncx-contact .done{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:17px;
          line-height:1.6;color:var(--ncx-ink);margin:0}
        .ncx-contact .req{color:var(--ncx-crimson-ink)}
        @media(max-width:860px){.ncx-contact{padding-block:40px}
          .ncx-contact .cols{grid-template-columns:1fr;gap:28px}}
      `}</style>

      <div className="cols">
        <div>
          {label ? <Reveal as="p" from="left" className="label">{label}</Reveal> : null}
          {/* As the page's H1 it is plain: an H1 is never hidden or split (it can be the LCP). */}
          {heading ? (
            headingLevel === 'h1' ? <h1>{heading}</h1> : <SplitHeading as="h2">{heading}</SplitHeading>
          ) : null}
          {intro ? <Reveal as="p" className="intro">{intro}</Reveal> : null}
        </div>

        <div className="card">
          <div className="in">
            {status === 'done' ? (
              <p className="done" role="status">
                {successMessage || "Thanks, we've got your enquiry and will be in touch shortly."}
              </p>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  submit()
                }}
              >
                <div className="field">
                  <label htmlFor="ncx-name">
                    Your name <span className="req" aria-hidden="true">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    id="ncx-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    aria-invalid={missing.name || undefined}
                    aria-describedby={missing.name && error ? 'ncx-contact-error' : undefined}
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="ncx-company">Company name</label>
                  <input
                    id="ncx-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    value={values.company}
                    onChange={(e) => set('company', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="ncx-email">
                    Business email <span className="req" aria-hidden="true">*</span>
                  </label>
                  <input
                    ref={emailRef}
                    id="ncx-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={missing.email || undefined}
                    aria-describedby={missing.email && error ? 'ncx-contact-error' : undefined}
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="ncx-mobile">Mobile number with country code</label>
                  <input
                    id="ncx-mobile"
                    name="mobile"
                    type="tel"
                    autoComplete="tel"
                    value={values.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                  />
                </div>

                {showMessageField !== false ? (
                  <div className="field">
                    <label htmlFor="ncx-message">What would you like to automate?</label>
                    <textarea
                      id="ncx-message"
                      name="message"
                      value={values.message}
                      onChange={(e) => set('message', e.target.value)}
                    />
                  </div>
                ) : null}

                <div className="hp" aria-hidden="true">
                  <label htmlFor="ncx-website">Website</label>
                  <input
                    id="ncx-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={values.website}
                    onChange={(e) => set('website', e.target.value)}
                  />
                </div>

                <button type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : buttonLabel || 'Submit enquiry'}
                </button>

                {/* Always in the page, so the alert is announced when its text arrives. */}
                <p id="ncx-contact-error" className="err" role="alert">
                  {error}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
