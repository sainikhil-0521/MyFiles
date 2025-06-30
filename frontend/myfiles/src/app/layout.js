import Sidebar from "@/components/Sidebar";
import "@/styles/globals.css";
import IsSideBarOpenProvider from "@/context/SideBarProvider";

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className="flex">
        <IsSideBarOpenProvider>
          <Sidebar/>
          <main className="flex-1 p-6 bg-gray-100 min-h-screen">
            {children}
          </main>
        </IsSideBarOpenProvider>
      </body>
    </html>
  );
}
