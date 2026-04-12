import dynamic from 'next/dynamic'

// Dynamically import FontAwesomeIcon to avoid SSR issues
const FontAwesomeIcon = dynamic(() => import('@fortawesome/react-fontawesome').then(mod => mod.FontAwesomeIcon), {
  ssr: false,
  loading: () => <span style={{ width: '1em', height: '1em', display: 'inline-block' }}></span>
})

export default FontAwesomeIcon