import * as z from 'zod'
 
const allowedRoles = ['admin', 'editor', 'photographer', 'receptionist'] as const

const RoleSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return val
    return val.trim()
  },
  z
    .string()
    .refine((val) => (allowedRoles as readonly string[]).includes(val), {
      error: 'Please select a role',
    })
)

const PhoneNumberSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return val
    const trimmed = val.trim()
    return trimmed.length === 0 ? undefined : trimmed
  },
  z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        const cleaned = val.replace(/[\s-]/g, '')
        const phonePattern = /^0[1-9]\d{8}$/
        return phonePattern.test(cleaned)
      },
      {
        error: 'Enter a valid 10-digit Sri Lankan phone number (e.g., 0771234567)',
      }
    )
)

const RequiredPhoneNumberSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return ''
    return val.trim()
  },
  z
    .string()
    .min(1, { error: 'Phone number is required.' })
    .pipe(
      z.string().refine(
        (val) => {
          const cleaned = val.replace(/[\s-]/g, '')
          const phonePattern = /^0[1-9]\d{8}$/
          return phonePattern.test(cleaned)
        },
        {
          error: 'Enter a valid 10-digit Sri Lankan phone number (e.g., 0771234567)',
        }
      )
    )
)

const EmailSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return ''
    return val.trim()
  },
  z
    .string()
    .min(1, { error: 'Email is required.' })
    .pipe(z.string().email({ error: 'Please enter a valid email.' }))
)

export const ClientRegistrationSchema = z.object({
  firstName: z.string().min(1, { error: 'First name is required.' }).trim(),
  lastName: z.string().min(1, { error: 'Last name is required.' }).trim(),
  phoneNumber: RequiredPhoneNumberSchema,
})

export const SignupFormSchema = z
  .object({
    firstName: z.string().min(1, { error: 'First name is required.' }).trim(),
    lastName: z.string().min(1, { error: 'Last name is required.' }).trim(),
    phoneNumber: PhoneNumberSchema,
    role: RoleSchema,

    email: EmailSchema,
    password: z
      .string()
      .min(1, { error: 'Password is required.' })
      .refine((val) => val.trim().length > 0, { error: 'Password is required.' }),
  })

export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(1, { error: 'Password is required.' })
    .refine((val) => val.trim().length > 0, { error: 'Password is required.' }),
})



export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1, { error: 'First name is required.' }).trim(),
  lastName: z.string().min(1, { error: 'Last name is required.' }).trim(),
  email: EmailSchema,
  phoneNumber: PhoneNumberSchema,
})

export const UserUpdateSchema = z.object({
  firstName: z.string().min(1, { error: 'First name is required.' }).trim(),
  lastName: z.string().min(1, { error: 'Last name is required.' }).trim(),
  email: EmailSchema,
  role: RoleSchema,
  phoneNumber: PhoneNumberSchema,
})
 
export type FormState =
  | {
      errors?: {
        firstName?: string[]
        lastName?: string[]
        phoneNumber?: string[]
        role?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
      redirectTo?: string
    }
  | undefined
