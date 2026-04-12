import { useState, useEffect } from 'react'
import styles from './SplashScreen.module.css'

export default function SplashScreen({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [particles, setParticles] = useState([])

  useEffect(() => {
    setIsMounted(true)
    // Generate particles only on client side
    setParticles([...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3
    })))
  }, [])

  useEffect(() => {
    // Start fade out animation after 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 2500)

    // Complete splash screen after animation
    const completeTimer = setTimeout(() => {
      setIsVisible(false)
      if (onComplete) {
        onComplete()
      }
    }, 3200)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`${styles.splashScreen} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.splashContent}>
        {/* Animated background circles */}
        <div className={`${styles.splashBgCircle} ${styles.circle1}`}></div>
        <div className={`${styles.splashBgCircle} ${styles.circle2}`}></div>
        <div className={`${styles.splashBgCircle} ${styles.circle3}`}></div>
        
        {/* Logo container with pulse animation */}
        <div className={styles.splashLogoContainer}>
          <div className={styles.splashLogoRing}></div>
          <div className={styles.splashLogo}>
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 200 200" 
              xmlns="http://www.w3.org/2000/svg"
              className={styles.splashLogoSvg}
            >
              <circle cx="100" cy="100" r="95" fill="#0A2342" stroke="#D4A017" strokeWidth="10"/>
              <text 
                x="100" 
                y="130" 
                textAnchor="middle" 
                fontSize="100" 
                fontFamily="Arial, sans-serif" 
                fill="#D4A017" 
                fontWeight="bold"
              >
                U
              </text>
            </svg>
          </div>
        </div>

        {/* App name with typing effect */}
        <div className={styles.splashAppName}>
          <span className={styles.splashLetter} style={{ animationDelay: '0.1s' }}>U</span>
          <span className={styles.splashLetter} style={{ animationDelay: '0.15s' }}>N</span>
          <span className={styles.splashLetter} style={{ animationDelay: '0.2s' }}>I</span>
          <span className={styles.splashLetter} style={{ animationDelay: '0.25s' }}>F</span>
          <span className={styles.splashLetter} style={{ animationDelay: '0.3s' }}>Y</span>
        </div>

        {/* Tagline */}
        <p className={styles.splashTagline}>Connect. Share. Inspire.</p>

        {/* Loading indicator */}
        <div className={styles.splashLoader}>
          <div className={styles.splashLoaderBar}></div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className={styles.splashParticles}>
        {isMounted && particles.map((particle) => (
          <div 
            key={particle.id} 
            className={styles.splashParticle} 
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  )
}
