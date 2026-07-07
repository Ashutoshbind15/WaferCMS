import { useNavigate } from "react-router";
import { DiagramEditor } from "../../components/forms/diagram-form";
import { EMPTY_DOCUMENT } from "@scribblesvg/core";

export default function DiagramCreatePage() {
  const navigate = useNavigate();

  return (
    <DiagramEditor
      pageTitle="New Diagram"
      initialTitle=""
      initialDocument={EMPTY_DOCUMENT}
      onBack={() => navigate("/diagrams")}
    />
  );
}
