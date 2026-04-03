import { Header } from "@/components/layout/header";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

export default function DiagramsListPage() {
  return (
    <>
      <Header title="Diagrams" action={<Button disabled>New Diagram</Button>} />
      <PageContainer>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Diagrams are coming soon
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            This section is under development. Diagram creation and editing will
            be available in a future update.
          </p>
        </div>
      </PageContainer>
    </>
  );
}
