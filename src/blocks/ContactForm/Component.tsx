'use client'

import React, { useState } from 'react'

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  buttonLabel?: string | null
  successMessage?: string | null
  showMessageField?: boolean | null
}

export const ContactFormBlock: React.FC<Props> = ({
  label,
  heading,
  intro,
  buttonLabel,
  successMessage,
  showMessageField,
}) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
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

    if (!values.name.trim() || !values.email.trim()) {
      setError('Name and business email are required.')
      setStatus('error')
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
    <section className="ncx-contact">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500&family=Source+Serif+4:opsz,wght@8..60,400&display=swap');
        .ncx-contact{--ink:#16203A;--soft:#4A5573;--crimson:#E0245E;--violet:#6E5BF2;
          --cyan:#18B6AE;--rule:#E4E7F0;--mist:#F7F8FC;
          max-width:1120px;margin:0 auto;padding:56px 32px;
          font-family:"Source Serif 4",Georgia,serif;color:var(--ink)}
        .ncx-contact .cols{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start}
        .ncx-contact .label{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:14px;
          margin:0 0 12px;background:linear-gradient(90deg,var(--crimson),var(--violet));
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .ncx-contact h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:18ch}
        .ncx-contact .intro{color:var(--soft);margin:14px 0 0;max-width:46ch;font-size:18px;line-height:1.6}
        .ncx-contact .card{border-radius:16px;padding:1px;
          background:linear-gradient(160deg,rgba(110,91,242,.35),rgba(24,182,174,.18),var(--rule))}
        .ncx-contact .in{background:#fff;border-radius:15px;padding:28px 26px}
        .ncx-contact .field{margin-bottom:16px}
        .ncx-contact label{display:block;font-family:"Bricolage Grotesque",system-ui,sans-serif;
          font-size:13px;color:var(--soft);margin-bottom:6px}
        .ncx-contact input,.ncx-contact textarea{width:100%;font-family:"Source Serif 4",Georgia,serif;
          font-size:16px;color:var(--ink);background:var(--mist);
          border:1px solid var(--rule);border-radius:8px;padding:11px 13px}
        .ncx-contact textarea{min-height:96px;resize:vertical}
        .ncx-contact input:focus,.ncx-contact textarea:focus{outline:2px solid var(--violet);
          outline-offset:1px;background:#fff}
        .ncx-contact .hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
        .ncx-contact button{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:15px;
          font-weight:500;padding:13px 24px;border-radius:8px;border:0;cursor:pointer;
          background:var(--ink);color:#fff;margin-top:4px}
        .ncx-contact button[disabled]{opacity:.6;cursor:default}
        .ncx-contact .err{color:var(--crimson);font-size:15px;margin:12px 0 0}
        .ncx-contact .done{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:17px;
          line-height:1.6;color:var(--ink);margin:0}
        .ncx-contact .req{color:var(--crimson)}
        @media(max-width:860px){.ncx-contact{padding:40px 20px}
          .ncx-contact .cols{grid-template-columns:1fr;gap:28px}}
      `}</style>

      <div className="cols">
        <div>
          {label ? <p className="label">{label}</p> : null}
          {heading ? <h2>{heading}</h2> : null}
          {intro ? <p className="intro">{intro}</p> : null}
        </div>

        <div className="card">
          <div className="in">
            {status === 'done' ? (
              <p className="done">
                {successMessage || "Thanks — we've got your enquiry and will be in touch shortly."}
              </p>
            ) : (
              <div>
                <div className="field">
                  <label htmlFor="ncx-name">
                    Your name <span className="req">*</span>
                  </label>
                  <input
                    id="ncx-name"
                    type="text"
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="ncx-company">Company name</label>
                  <input
                    id="ncx-company"
                    type="text"
                    value={values.company}
                    onChange={(e) => set('company', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="ncx-email">
                    Business email <span className="req">*</span>
                  </label>
                  <input
                    id="ncx-email"
                    type="email"
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="ncx-mobile">Mobile number with country code</label>
                  <input
                    id="ncx-mobile"
                    type="tel"
                    value={values.mobile}
                    onChange={(e) => set('mobile', e.target.value)}
                  />
                </div>

                {showMessageField !== false ? (
                  <div className="field">
                    <label htmlFor="ncx-message">What would you like to automate?</label>
                    <textarea
                      id="ncx-message"
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

                <button type="button" onClick={submit} disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : buttonLabel || 'Submit enquiry'}
                </button>

                {error ? <p className="err">{error}</p> : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
