import { Button } from "./components/ui/button";
import RichTextEditor from "./components/editor/rich-text-editor";
import { EMPTY_EDITOR_DOC } from "./components/editor/rich-text-document";

const App = () => {
  return (
    <div className="">
      <p>CMS Client</p>
      <Button
        onClick={() => {
          console.log("Button clicked");
        }}
      >
        Click me
      </Button>
      <RichTextEditor initialContent={EMPTY_EDITOR_DOC} isEditable={true} />
    </div>
  );
};

export default App;
