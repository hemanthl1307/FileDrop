import "./globals.css";

export const metadata = {
  title: "FileDrop — direct device-to-device transfer",
  description:
    "Send files straight from your device to anyone, anywhere. No accounts, no uploads to a server, files never touch storage in between.",
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#080B14" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Runs before paint so there is no light/dark flash on load.
const themeInitScript = `
(function(){
  try {
    var stored = localStorage.getItem('filedrop-theme');
  var isDark = stored ? stored === 'dark' : false;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-display">{children}</body>
    </html>
  );
}
