'use client';

export default function CreditDisplay({ creditInfo, compact = false }) {
  if (!creditInfo) return null;
  
  const percentage = creditInfo.totalCredits > 0 
    ? ((creditInfo.totalCredits - creditInfo.creditsRemaining) / creditInfo.totalCredits) * 100 
    : 100;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Credits:</span>
        <span className={`font-medium ${
          creditInfo.creditsRemaining < 20 ? 'text-orange-600' : 'text-gray-900'
        }`}>
          {creditInfo.creditsRemaining} / {creditInfo.totalCredits}
        </span>
        {creditInfo.creditsRemaining < 20 && creditInfo.creditsRemaining > 0 && (
          <span className="text-xs text-orange-600">(Low)</span>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-900">Credit Balance</h3>
        <span className="text-sm text-gray-600">
          {creditInfo.subscription === 'free' ? 'Free Trial' : creditInfo.subscription}
        </span>
      </div>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Credits remaining</span>
          <span className="font-medium">
            {creditInfo.creditsRemaining} / {creditInfo.totalCredits}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentage > 80 ? 'bg-red-500' : 
              percentage > 60 ? 'bg-orange-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      
      {creditInfo.creditsRemaining < 20 && (
        <div className={`text-sm ${
          creditInfo.creditsRemaining === 0 ? 'text-red-600' : 'text-orange-600'
        }`}>
          {creditInfo.creditsRemaining === 0 ? (
            <p>Out of credits! <a href="/pricing" className="underline font-medium">Upgrade now</a></p>
          ) : (
            <p>Running low on credits. <a href="/pricing" className="underline">Get more</a></p>
          )}
        </div>
      )}
    </div>
  );
}