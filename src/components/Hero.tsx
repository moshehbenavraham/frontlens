import { motion } from 'framer-motion'
import { Volume2, VolumeX, Menu, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ThemeToggle } from './ThemeToggle'

// Single source of truth for the in-page nav. Used for both the desktop nav
// row and the mobile menu so the two surfaces can't drift out of sync.
const NAV_LINKS = [
  { href: '#portfolio', label: 'Work' },
  { href: '#about', label: 'Process' },
  { href: '#services', label: 'Capabilities' },
  { href: '#team', label: 'Team' },
  { href: '#contact', label: 'Contact' },
] as const

// Focus ring shared by every interactive element sitting on top of the
// dark video. A bright white outline with a contrasting dark offset reads
// clearly against the underlying footage AND against the scrolled glass nav.
const DARK_FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60'

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (event: MediaQueryListEvent) => setPrefers(event.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefers
}

export function Hero() {
  const [isMuted, setIsMuted] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Track scroll position with a passive listener + rAF throttle. Default
  // scroll handlers block paint and are a measurable jank source — passive
  // + rAF keeps the navbar transition smooth on mobile.
  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 50)
        ticking = false
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Bootstrap the hero video. Visitors who prefer reduced motion get a
  // paused first frame instead of an autoplaying loop — this respects
  // vestibular accessibility without dropping the dramatic backdrop.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = 0
    video.muted = true
    video.defaultMuted = true
    if (prefersReducedMotion) {
      try {
        video.pause()
      } catch {
        /* noop */
      }
    } else {
      video.play()?.catch(() => undefined)
    }
  }, [prefersReducedMotion])

  // Pause the hero video while it is offscreen. Without this, the 12MB
  // looping WebM keeps decoding for the entire session even after the
  // visitor scrolls into the static lower sections — a real battery and
  // CPU cost, especially on mobile.
  useEffect(() => {
    const video = videoRef.current
    const host = heroRef.current
    if (!video || !host || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          if (!prefersReducedMotion) {
            video.play()?.catch(() => undefined)
          }
        } else {
          try {
            video.pause()
          } catch {
            /* noop */
          }
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(host)
    return () => observer.disconnect()
  }, [prefersReducedMotion])

  // Sync the audio toggle's visual state with the actual <video> element.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
      videoRef.current.volume = isMuted ? 0 : 0.7
    }
  }, [isMuted])

  // Lock background scroll while the mobile menu is open so the content
  // behind the panel doesn't slide around under the user's finger.
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Move keyboard focus into the mobile menu when it opens and back to the
  // hamburger when it closes. Without this, opening the menu strands focus
  // on a now-hidden button and tabbing wanders into the page behind the
  // scrim — neither is acceptable for screen reader / keyboard users.
  useEffect(() => {
    if (isMobileMenuOpen) {
      const id = window.setTimeout(() => {
        firstMobileLinkRef.current?.focus({ preventScroll: true })
      }, 50)
      return () => window.clearTimeout(id)
    }
    // Only restore focus to the hamburger if it's still in the DOM and the
    // user wasn't already off interacting with something else.
    const hamburger = hamburgerRef.current
    if (
      hamburger &&
      document.body.contains(hamburger) &&
      (document.activeElement === document.body || document.activeElement === null)
    ) {
      hamburger.focus({ preventScroll: true })
    }
  }, [isMobileMenuOpen])

  // Escape closes the mobile menu. Standard expectation for any overlay
  // dialog / drawer and a quick win for keyboard parity with mouse users
  // who can dismiss by clicking the scrim.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isMobileMenuOpen])

  // Close the menu when the underlying page scrolls. Arm the listener on
  // the next animation frame so the synthetic scroll from opening the menu
  // (or from focusing the first link) doesn't immediately close it.
  useEffect(() => {
    if (!isMobileMenuOpen) return
    let armed = false
    const rafId = window.requestAnimationFrame(() => {
      armed = true
    })
    const handleScroll = () => {
      if (armed) setIsMobileMenuOpen(false)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isMobileMenuOpen])

  const smoothBehavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth'

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: smoothBehavior })
  }, [smoothBehavior])

  const scrollToContact = useCallback(() => {
    document.getElementById('contact')?.scrollIntoView({ behavior: smoothBehavior })
  }, [smoothBehavior])

  return (
    <div
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      {/* MASSIVE VIDEO — Takes up 95% of space. preload="metadata" defers */}
      {/* the full 12MB body until autoPlay actually needs to play, which is */}
      {/* especially kind to mobile / cellular visitors. The decorative video */}
      {/* has no narrative audio so we mark it aria-hidden for assistive tech. */}
      {/* The autoPlay flag is gated on prefers-reduced-motion so vestibular- */}
      {/* sensitive visitors get a stationary backdrop. An IntersectionObserver */}
      {/* (see the effect above) pauses the loop when the hero leaves view, */}
      {/* preventing CPU / battery drain during long page sessions. */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-110"
        autoPlay={!prefersReducedMotion}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="https://mojli.s3.us-east-2.amazonaws.com/Mojli+Website+upscaled+(12mb).webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      {/* Full-Width Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        aria-label="Primary"
        className="fixed top-0 left-0 right-0 w-full z-[110]"
      >
        <div
          className={`w-full px-6 sm:px-8 lg:px-12 py-4 transition-all duration-300 ease-out ${
            isScrolled
              ? 'bg-black/80 backdrop-blur-xl border-b border-white/10'
              : 'bg-transparent'
          }`}
        >
          <div className="flex items-center justify-between">
            {/* Logo — semantic button so keyboard users can press Enter to */}
            {/* return to the top of the page, not just mouse users. */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              onClick={scrollToTop}
              aria-label="MOJJU — scroll to top"
              className={`flex items-center cursor-pointer rounded-sm ${DARK_FOCUS_RING}`}
            >
              <span className="font-bagel text-white text-xl tracking-wider">MOJJU</span>
            </motion.button>

            {/* Navigation Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-white hover:text-white/80 font-medium gentle-animation hover:scale-105 rounded-md px-2 py-1 ${DARK_FOCUS_RING}`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Right Side - Video Controls + CTA + Mobile Menu */}
            <div className="flex items-center space-x-3 relative">
              {/* Theme toggle — hidden on the smallest viewports to avoid */}
              {/* cramping the mobile header; the mobile menu surfaces a labelled */}
              {/* version in its panel. */}
              <ThemeToggle className="hidden sm:inline-flex" />

              {/* Video Controls with Sound On indicator */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  aria-label={isMuted ? 'Unmute hero video' : 'Mute hero video'}
                  aria-pressed={!isMuted}
                  className={`glass-effect p-3 rounded-full text-white hover:bg-white/20 gentle-animation cursor-pointer ${DARK_FOCUS_RING}`}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>

                {/* Sound On indicator - only show when muted */}
                {isMuted && (
                  <div
                    className="absolute -bottom-10 right-0 flex items-center text-white/80"
                    aria-hidden="true"
                  >
                    <span className="whitespace-nowrap font-medium text-sm mr-2">Sound On</span>
                    <span className="text-lg">↗</span>
                  </div>
                )}
              </div>

              {/* CTA Button - Hidden on mobile */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={scrollToContact}
                className={`hidden sm:block bg-red-600 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-md hover:bg-red-700 gentle-animation ml-4 cursor-pointer ${DARK_FOCUS_RING}`}
              >
                Book a Call
              </motion.button>

              {/* Mobile Hamburger Menu Button */}
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                className={`md:hidden glass-effect p-3 rounded-full text-white hover:bg-white/20 active:bg-white/30 gentle-animation cursor-pointer z-[120] relative ${DARK_FOCUS_RING}`}
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Menu className="w-5 h-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-[80] cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      <motion.div
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        initial={{ x: '100%' }}
        animate={{ x: isMobileMenuOpen ? '0%' : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="md:hidden fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-black/90 backdrop-blur-xl border-l border-white/10 z-[90] mobile-menu-panel pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="flex flex-col h-full">
          {/* Close Button at the top */}
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close navigation menu"
              className={`glass-effect p-3 rounded-full text-white hover:bg-white/20 active:bg-white/30 gentle-animation cursor-pointer ${DARK_FOCUS_RING}`}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col px-6 pb-6 h-full">
            {/* Mobile Navigation Links */}
            <nav aria-label="Mobile primary">
              <ul className="flex flex-col space-y-4 text-white list-none p-0">
                {NAV_LINKS.map((link, index) => (
                  <li key={link.href}>
                    <a
                      ref={index === 0 ? firstMobileLinkRef : undefined}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`mobile-menu-link block px-4 py-3 hover:text-white/80 hover:bg-white/10 rounded-lg gentle-animation font-medium text-lg active:bg-white/20 ${DARK_FOCUS_RING}`}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Theme toggle inside mobile menu — labelled variant so the */}
            {/* current mode is readable while in a compact panel. */}
            <div className="mt-6">
              <ThemeToggle variant="inline" />
            </div>

            {/* Mobile CTA Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                scrollToContact()
                setIsMobileMenuOpen(false)
              }}
              className={`bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 active:bg-red-800 gentle-animation mt-6 cursor-pointer ${DARK_FOCUS_RING}`}
            >
              Book a Call
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Big Studio Title - Lower Left */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-12 left-6 sm:left-8 lg:left-12 z-40"
      >
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight text-white">
            <span className="block">AI FILM</span>
            <span className="block">PRODUCTION</span>
            <span className="block">WITHOUT LIMITS</span>
          </h1>
        </div>
      </motion.div>
    </div>
  )
}
