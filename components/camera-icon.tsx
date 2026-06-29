'use client'

import dynamic from 'next/dynamic'

const PhotoCameraIcon = dynamic(() => import('@mui/icons-material/PhotoCamera'), {
  ssr: false,
  loading: () => null,
})

export default function CameraIcon() {
  return <PhotoCameraIcon style={{ fontSize: 20, color: '#1d3658' }} />
}
