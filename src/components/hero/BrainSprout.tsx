export default function BrainSprout() {
  return (
    <div className="relative h-full w-full">
      {/* یک لایه خیلی ظریف برای حس لوکس */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />

      <svg
        className="rane-svg absolute inset-0 m-auto h-[80%] w-[80%]"
        viewBox="0 0 520 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="RANE Brain Sprout"
      >
        {/* مغز - خطی */}
        <path
          className="rane-brain"
          d="M178 332c-18 4-38-7-46-26-9-21 2-44 23-53-8-21 2-46 24-55 2-26 24-46 50-43 9-22 34-35 57-28 20-18 52-14 67 9 25-7 53 9 58 35 24 5 40 31 35 55 21 10 31 35 20 56-9 18-28 28-48 25-10 17-30 27-50 22-13 16-33 23-52 16-18 12-43 10-58-5-21 7-44-1-54-20-16 3-33-3-41-18z"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* چند خط داخلی مغز برای حس تکمیل‌شدن */}
        <path
          className="rane-detail rane-delay-1"
          d="M210 200c20-20 58-18 74 6"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          className="rane-detail rane-delay-2"
          d="M238 276c18-10 44-6 56 10"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          className="rane-detail rane-delay-3"
          d="M320 225c20-10 45-2 55 16"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* ساقه جوانه */}
        <path
          className="rane-sprout rane-delay-4"
          d="M260 150c0 0 2-35 25-55"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* برگ چپ */}
        <path
          className="rane-leaf rane-delay-5"
          d="M285 92c-24-8-52 4-66 26 28 10 55 2 66-26z"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="round"
        />

        {/* برگ راست */}
        <path
          className="rane-leaf rane-delay-6"
          d="M290 96c26-14 58-4 72 20-30 14-58 10-72-20z"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="round"
        />

        {/* پرشدن خیلی ظریف بعد از کامل شدن خطوط */}
        <path
          className="rane-fill"
          d="M178 332c-18 4-38-7-46-26-9-21 2-44 23-53-8-21 2-46 24-55 2-26 24-46 50-43 9-22 34-35 57-28 20-18 52-14 67 9 25-7 53 9 58 35 24 5 40 31 35 55 21 10 31 35 20 56-9 18-28 28-48 25-10 17-30 27-50 22-13 16-33 23-52 16-18 12-43 10-58-5-21 7-44-1-54-20-16 3-33-3-41-18z"
          fill="currentColor"
          opacity="0"
        />
      </svg>
    </div>
  );
}
