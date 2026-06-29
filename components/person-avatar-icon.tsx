'use client'

import dynamic from 'next/dynamic'

const PersonIcon = dynamic(() => import('@mui/icons-material/Person'), {
  ssr: false,
  loading: () => null,
})

export default function PersonAvatarIcon() {
  return <PersonIcon style={{ fontSize: 56, color: '#f8fafc' }} />
}
