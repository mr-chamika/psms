"use server"

import { SignupFormSchema, FormState } from "@/lib/validations"
import { addUser, findUserByEmail } from "@/lib/services/user.service"
import bcrypt from "bcryptjs"

export async function signup(
	state: FormState,
	formData: FormData
): Promise<FormState> {
	const validatedFields = SignupFormSchema.safeParse({
		firstName: formData.get("firstName"),
		lastName: formData.get("lastName"),
		email: formData.get("email"),
		password: formData.get("password"),
	})

	if (!validatedFields.success) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
		}
	}

	const { firstName, lastName, email, password } = validatedFields.data

	const existingUser = await findUserByEmail(email)
	if (existingUser) {
		return {
			errors: {
				email: ["An account with this email already exists."],
			},
		}
	}

	const storedPassword = await bcrypt.hash(password, 12)

	await addUser({
		firstName,
		lastName,
		email,
		password: storedPassword,
	})

	return {
		message: "Signup successful. You can now sign in.",
	}
}
