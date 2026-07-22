import Sidebar from "@/components/layout/sidebar/Sidebar";
import Topbar from "@/components/layout/topbar/Topbar";

export default function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">

      <Sidebar />

      <main className="flex flex-1 flex-col">

        <Topbar
          breadcrumb={[
            { label: "Admin", href: "/dashboard" },
            { label: "Equipo" },
          ]}
        />

        <section className="flex-1 p-8">
          {children}
        </section>

      </main>

    </div>
  );
}