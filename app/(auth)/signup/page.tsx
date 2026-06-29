import SignupForm from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-white border border-[rgba(229,231,235,0.5)] p-8 shadow-[0px_8px_10px_-6px_rgba(0,0,0,0.1),0px_20px_25px_-5px_rgba(0,0,0,0.1)]">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-[#0f1729]">Create your account</h1>
          <p className="text-sm text-[#6b7280]">Sign up to get started</p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
