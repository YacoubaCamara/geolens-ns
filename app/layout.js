export const metadata = {
  title: "GeoLens NS",
  description: "Nova Scotia geoscience assistant",
  icons: {
    icon: "/rock.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
        {children}
      </body>
    </html>
  );
}