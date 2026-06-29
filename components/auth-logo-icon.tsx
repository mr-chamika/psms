'use client'

import dynamic from 'next/dynamic'

const PhotoCameraIcon = dynamic(() => import('@mui/icons-material/PhotoCameraOutlined'), {
  ssr: false,
  loading: () => null,
})

export default function AuthLogoIcon() {
  return <PhotoCameraIcon style={{ fontSize: 32, color: '#f8fafc' }} />
}
