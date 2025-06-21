import ClientOnly from "@/components/ClientOnly";
import VTKFileViewer from "./VTKFileViewer";

export default function Page() {
  return (
    <ClientOnly>
      <VTKFileViewer />
    </ClientOnly>
  );
}
