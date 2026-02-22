"use client";

import ReferralBoard from "@/components/panel/therapist/ReferralBoard";

export default function ReferralsClient({ therapistEmail }: { therapistEmail: string }) {
  return <ReferralBoard therapistEmail={therapistEmail} />;
}
