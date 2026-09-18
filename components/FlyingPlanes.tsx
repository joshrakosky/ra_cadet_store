// Flying Planes Animation Component
// Displays small animated planes flying around the background with proper rotation

'use client'

export default function FlyingPlanes() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Plane 1 - Top-left quadrant, diagonal down-right */}
      <div 
        className="absolute text-white opacity-20"
        style={{
          top: '0%',
          left: '-50px',
          animation: 'flyBounce1 28s ease-in-out infinite',
          animationDelay: '0s'
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transformOrigin: 'center' }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
      </div>

      {/* Plane 2 - Middle-right area, moving left */}
      <div 
        className="absolute text-white opacity-15"
        style={{
          top: '35%',
          right: '-50px',
          animation: 'flyBounce2 22s ease-in-out infinite',
          animationDelay: '2s'
        }}
      >
        <svg width="35" height="35" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transformOrigin: 'center' }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
      </div>

      {/* Plane 3 - Bottom-left quadrant, moving up-right */}
      <div 
        className="absolute text-white opacity-25"
        style={{
          bottom: '0%',
          left: '-50px',
          animation: 'flyBounce3 20s ease-in-out infinite',
          animationDelay: '4s'
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transformOrigin: 'center' }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
      </div>

      {/* Plane 4 - Top-right quadrant, moving left-down */}
      <div 
        className="absolute text-white opacity-20"
        style={{
          top: '0%',
          right: '-50px',
          animation: 'flyBounce4 26s ease-in-out infinite',
          animationDelay: '1s'
        }}
      >
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transformOrigin: 'center' }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
      </div>

      {/* Plane 5 - Bottom-right quadrant, moving left-up */}
      <div 
        className="absolute text-white opacity-15"
        style={{
          bottom: '0%',
          right: '-50px',
          animation: 'flyBounce5 24s ease-in-out infinite',
          animationDelay: '3s'
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transformOrigin: 'center' }}>
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  )
}
