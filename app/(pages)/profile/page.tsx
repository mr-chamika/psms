import { cookies } from 'next/headers'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth'
import { getUserById } from '@/lib/services/user.service'
import PersonAvatarIcon from '@/components/person-avatar-icon'
import CameraIcon from '@/components/camera-icon'
import ProfileUpdateForm from '@/components/profile-update-form'
import { PAGE_CONTENT } from '@/lib/list-page-styles'

function formatRole(role: string | null | undefined) {
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifyAuthToken(token) : null

  const user = session ? await getUserById(session.sub) : null

  const firstName = (user?.firstName ?? '').toString()
  const lastName = (user?.lastName ?? '').toString()
  const fullName = `${firstName} ${lastName}`.trim() || 'My Profile'

  const role = (user?.role ?? session?.role ?? null) as string | null
  const email = (user?.email ?? session?.email ?? '').toString()
  const phoneNumber = (user?.phoneNumber ?? '').toString()

  return (
    <div className="min-h-screen w-full bg-[#f6f7f9]">
      <div className={`mx-auto max-w-7xl ${PAGE_CONTENT}`}>
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mx-auto lg:w-full lg:max-w-[1084px]">
          <h1 className="text-2xl font-bold text-black sm:text-3xl">My Profile</h1>
          <p className="mt-1 text-sm text-[#6b7280] sm:text-base">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Cards Container */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-center">
          {/* Left Card - Profile Picture */}
          <div className="w-full max-h-[640px] min-h-[500px] rounded-xl border border-[#e5e7eb] bg-white shadow-sm lg:w-[340px]">
            <div className="flex h-full flex-col items-center justify-center px-6 py-16">
              {/* Avatar with Camera Icon */}
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1d3658]">
                  <PersonAvatarIcon />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f7f9]">
                  <CameraIcon />
                </div>
              </div>

              {/* Name and Role */}
              <div className="mt-4 text-center">
                <p className="text-xl font-bold text-black">{fullName}</p>

                {role && (
                  <div className="mt-2 inline-flex items-center justify-center rounded-full border border-[rgba(245,159,10,0.2)] bg-[rgba(245,159,10,0.1)] px-3 py-0.5">
                    <span className="text-xs font-semibold text-[#1d3658]">
                      {formatRole(role)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Card - Profile Information */}
          <div className="w-full max-h-[640px] min-h-[500px] flex-1 rounded-xl border border-[#e5e7eb] bg-white shadow-sm lg:max-w-[720px]">
            <div className="px-6 py-8 sm:px-8 sm:py-12">
              <ProfileUpdateForm
                initialFirstName={firstName}
                initialLastName={lastName}
                initialEmail={email}
                initialPhoneNumber={phoneNumber}
              />

              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-black">
                    First Name
                  </label>
                  <div className="mt-3 flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f6f7f9] px-4">
                    <span className="text-sm text-black">{firstName || '—'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black">
                    Last Name
                  </label>
                  <div className="mt-3 flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f6f7f9] px-4">
                    <span className="text-sm text-black">{lastName || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Role Field */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-black">
                  Role
                </label>
                <div className="mt-3 flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f6f7f9] px-4">
                  <span className="text-sm text-black">
                    {role ? formatRole(role) : '—'}
                  </span>
                </div>
              </div>

              {/* Email Field */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-black">
                  Email
                </label>
                <div className="mt-3 flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f6f7f9] px-4">
                  <span className="truncate text-sm text-black">{email || '—'}</span>
                </div>
              </div>

              {/* Phone Field */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-black">
                  Phone
                </label>
                <div className="mt-3 flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f6f7f9] px-4">
                  <span className="text-sm text-black">{phoneNumber || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}