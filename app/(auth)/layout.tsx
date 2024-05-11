import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import Image from "next/image";
import Error from "./error";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full justify-between font-inter">
        {children}
        <div className="auth-asset">
          <div className="bg-transparent">
            <Image src="/icons/log.svg" alt="Auth image"width={700} height={600} className="bg-transparent"/>
          </div>
        </div>
    </main>
  );
}
