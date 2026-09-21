import { Suspense } from "react";
import FileDropApp from "@/components/FileDropApp";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FileDropApp />
    </Suspense>
  );
}
