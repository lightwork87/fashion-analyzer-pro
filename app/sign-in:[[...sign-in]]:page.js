import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">LL</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to LightLister AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <a href="/sign-up" className="font-medium text-purple-600 hover:text-purple-500">
              create a new account
            </a>
          </p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-none",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "w-full",
              formButtonPrimary: "bg-black hover:bg-gray-800",
              footerActionLink: "text-purple-600 hover:text-purple-500",
              identityPreviewEditButtonIcon: "text-purple-600",
              formFieldInput: "block w-full px-3 py-2 border border-gray-300 rounded-md",
              footerAction: "hidden"
            }
          }}
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}