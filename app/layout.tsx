import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import LanguageToggle from "@/components/LanguageToggle";

export const metadata = {
  title: "Premium Todo App",
  description: "Next Generation Todo List App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <LanguageToggle />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
