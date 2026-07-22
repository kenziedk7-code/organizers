import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PartnerLayout } from "./signup";

export const Route = createFileRoute("/partner/signup-success")({
  component: SignupSuccess,
});

function SignupSuccess() {
  const navigate = useNavigate();

  return (
    <PartnerLayout>
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900">
          🎉 Payment successful!
        </h2>
        <p className="mt-2 text-gray-600">
          Your partner account is being activated.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="h-5 w-5 text-amber-600 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-amber-800">Activation in Progress</h3>
          </div>
          <p className="text-sm text-amber-700">
            Activation may take a few minutes. You can log in now — if your
            payment hasn't been confirmed yet, you'll see a reminder on your
            dashboard.
          </p>
        </div>

        <button
          onClick={() => navigate({ to: "/partner/login" })}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
        >
          Go to Dashboard
        </button>
      </div>
    </PartnerLayout>
  );
}
