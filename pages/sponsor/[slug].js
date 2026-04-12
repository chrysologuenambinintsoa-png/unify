import React from 'react'

// Redirect any /sponsor/:slug request to /sponsors to avoid 404s
export default function SponsorSlug() {
  return null
}

export async function getServerSideProps(context) {
  // Always redirect to the sponsors listing
  return {
    redirect: {
      destination: '/sponsors',
      permanent: false,
    },
  }
}
