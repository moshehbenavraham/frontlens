import { useState, type FormEvent } from 'react'
import { CONTACT_EMAIL } from '../lib/site-config'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CONTACT_ENDPOINT =
  (import.meta.env.VITE_CONTACT_FORM_ENDPOINT as string | undefined) ?? ''

type Status = { tone: 'success' | 'error' | 'info'; message: string }

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)

  const usingMailtoFallback = !CONTACT_ENDPOINT

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const name = formData.name.trim()
    const email = formData.email.trim()
    const message = formData.message.trim()

    if (!name || !email || !message) {
      setStatus({ tone: 'error', message: 'Please fill in all fields.' })
      return
    }
    if (!EMAIL_REGEX.test(email)) {
      setStatus({ tone: 'error', message: 'Please enter a valid email address.' })
      return
    }

    setStatus(null)
    setIsSubmitting(true)

    // No backend endpoint configured: fall back to opening the user's
    // email client with a pre-filled draft so the inquiry isn't silently lost.
    if (usingMailtoFallback) {
      const subject = encodeURIComponent(`MOJJU project inquiry from ${name}`)
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— Sent from mojju.ai`,
      )
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
      setStatus({
        tone: 'info',
        message: 'Opening your email client with a pre-filled draft — send the email to finish.',
      })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      setStatus({ tone: 'success', message: "Message sent. We'll get back to you soon." })
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      console.error('Contact form submission failed', error)
      const subject = encodeURIComponent(`MOJJU project inquiry from ${name}`)
      const body = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\n\n${message}\n\n— Sent from mojju.ai`,
      )
      setStatus({
        tone: 'error',
        message: `Something went wrong sending your message. You can email us directly at ${CONTACT_EMAIL}.`,
      })
      // Stash a mailto so the failure surface offers a one-click escape hatch.
      window.setTimeout(() => {
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`
      }, 1500)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="relative py-32 bg-card/30">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-accent-emerald rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-muted-foreground">
              Let's Create Together
            </span>
            <div className="w-3 h-3 bg-accent-blue rounded-full animate-pulse" />
          </div>

          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-8">
            <span className="block mb-2">Ready to Light Up the Screen?</span>
          </h2>

          <p className="text-2xl lg:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Tell us about your project and we'll get back to you with a plan to bring your vision to cinematic reality
          </p>
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-background clean-border rounded-3xl overflow-hidden elevated-shadow">
            <div className="bg-card/50 px-8 py-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-foreground mb-1">
                    Get In Touch
                  </h3>
                  <p className="text-muted-foreground">
                    Fill out the form and we'll respond within 24 hours
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-3 h-3 bg-accent-emerald rounded-full" />
                  <span className="text-sm text-muted-foreground font-medium">Available now</span>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              aria-describedby="contact-form-disclaimer"
              className="p-8 space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={100}
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    maxLength={255}
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  maxLength={1000}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent-blue/50 transition-all resize-none"
                  placeholder="Tell us about your project..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-foreground text-background font-black text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Sending...'
                  : usingMailtoFallback
                    ? 'Send via Email'
                    : 'Send Message'}
              </button>
              <div
                aria-live="polite"
                aria-atomic="true"
                role={status?.tone === 'error' ? 'alert' : 'status'}
                className="min-h-[1.25rem]"
              >
                {status && (
                  <p
                    className={`text-sm font-semibold ${
                      status.tone === 'success'
                        ? 'text-accent-emerald'
                        : status.tone === 'error'
                          ? 'text-destructive'
                          : 'text-accent-blue'
                    }`}
                  >
                    {status.message}
                  </p>
                )}
              </div>
              {usingMailtoFallback && (
                <p
                  id="contact-form-disclaimer"
                  className="text-xs text-muted-foreground"
                >
                  Submitting opens your email client with a draft addressed to{' '}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  . Set <code className="font-mono">VITE_CONTACT_FORM_ENDPOINT</code> at build time to enable direct delivery.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-background clean-border rounded-2xl p-6 subtle-shadow">
              <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-accent-blue rounded-full" />
              </div>
              <h4 className="font-black text-foreground mb-2">Project Discussion</h4>
              <p className="text-muted-foreground text-sm">
                Share your vision and requirements with our team
              </p>
            </div>

            <div className="bg-background clean-border rounded-2xl p-6 subtle-shadow">
              <div className="w-12 h-12 bg-accent-emerald/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-accent-emerald rounded-full" />
              </div>
              <h4 className="font-black text-foreground mb-2">Custom Strategy</h4>
              <p className="text-muted-foreground text-sm">
                Get a tailored approach for your unique project
              </p>
            </div>

            <div className="bg-background clean-border rounded-2xl p-6 subtle-shadow">
              <div className="w-12 h-12 bg-accent-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 bg-accent-purple rounded-full" />
              </div>
              <h4 className="font-black text-foreground mb-2">Next Steps</h4>
              <p className="text-muted-foreground text-sm">
                Clear timeline and roadmap to bring your idea to life
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
