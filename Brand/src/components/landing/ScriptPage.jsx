import { SAMPLE_SCRIPT } from "../../data/schoolCatalog";

// A real Kanthast lesson script, set the way the production team reads it:
// each scene's direction for the animator on the left, the spoken lines on
// the right. Character names are capitalised because that is screenplay
// convention, not decoration.
export default function ScriptPage({ script = SAMPLE_SCRIPT, scenes = script.scenes.length, compact = false }) {
  return (
    <figure className={`script-page${compact ? " script-page-compact" : ""}`}>
      <figcaption className="script-head">
        <span className="script-title">{script.lesson}</span>
        <span className="script-context">{script.context}</span>
      </figcaption>
      <ol className="script-scenes">
        {script.scenes.slice(0, scenes).map((scene, index) => (
          <li key={index} className="script-scene">
            <p className="script-scene-no">Scene {index + 1}</p>
            <p className="script-direction">{scene.animation}</p>
            <div className="script-lines">
              {scene.lines.map((line, i) => (
                <p key={i} className="script-line">
                  <span className={`script-speaker script-speaker-${line.speaker.toLowerCase()}`}>{line.speaker}</span>
                  <span className="script-text">{line.text}</span>
                </p>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
