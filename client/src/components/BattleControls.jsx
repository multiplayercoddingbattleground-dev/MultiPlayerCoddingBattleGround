import { Play, Send } from "lucide-react";

function BattleControls({ onRun, onSubmit }) {

  return (
    <div className="battle-controls">

      <button
        className="run-btn"
        onClick={onRun}
      >
        <Play size={16} />
        Run Tests
      </button>

      <button
        className="submit-btn"
        onClick={onSubmit}
      >
        <Send size={16} />
        Submit Code
      </button>

    </div>
  );
}

export default BattleControls;