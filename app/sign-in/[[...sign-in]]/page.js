import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LL</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back to LightLister AI</h1>
          <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border-0",
              formButtonPrimary: "bg-black hover:bg-gray-800",
              footerActionLink: "text-black hover:text-gray-700"
            }
          }}
        />
      </div>
    </div>
  );
}