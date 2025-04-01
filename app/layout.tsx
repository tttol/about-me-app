import "./globals.css";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>About me - tttol</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        ></meta>
        <meta property="og:title" content="About me - tttol" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tttol.link/" />
        <meta property="og:image" content="/src/app/img/me-square.png" />
        <meta name="robots" content="noindex, nofollow" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%%22 y=%2250%%22 style=%22dominant-baseline:central;text-anchor:middle;font-size:90px;%22>👨🏼‍💻</text></svg>"
        ></link>
        <link
          rel="apple-touch-icon"
          href="/src/app/img/me-square.png"
          sizes="192x192"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
