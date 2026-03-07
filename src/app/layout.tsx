import type { Metadata } from "next";
import { SessionProvider } from "@/components/auth/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArchFlow \u2014 AWS \uC544\uD0A4\uD14D\uCC98 \uC124\uACC4 \uAC00\uC774\uB4DC",
  description: "14\uB2E8\uACC4 \uC704\uC790\uB4DC\uB97C \uD1B5\uD55C AWS \uC544\uD0A4\uD14D\uCC98 \uC124\uACC4 \uB3C4\uAD6C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="font-[Pretendard,sans-serif] antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
