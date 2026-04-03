import { Button } from "./components/ui/button";
import RichTextEditor from "./components/editor/rich-text-editor";

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
      <RichTextEditor content="" isEditable={true} />
    </div>
  );
};

export default App;
