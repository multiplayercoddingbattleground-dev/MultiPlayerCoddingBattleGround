function Battle() {
  return (
    <section className="battle-page">
      <div className="battle-topbar">
        <div>
          <h2>⚔ Coding Battle</h2>
          <p>Problem #001</p>
        </div>

        <div className="timer">
          ⏱ 29:59
        </div>
      </div>

      <div className="battle-layout">

        <div className="problem-panel">
          <h2>Two Sum</h2>

          <p>
            Given an array of integers and a target value,
            return the indices of the two numbers that add up
            to the target.
          </p>

          <h3>Example</h3>

          <pre>
{`Input:
nums = [2, 7, 11, 15]
target = 9

Output:
[0, 1]`}
          </pre>

          <h3>Constraints</h3>

          <ul>
            <li>2 ≤ nums.length</li>
            <li>Numbers are integers</li>
            <li>Exactly one solution exists</li>
          </ul>
        </div>

        <div className="editor-panel">

          <div className="editor-header">
            <select>
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>C++</option>
            </select>

            <button className="submit-btn">
              ▶ Submit
            </button>
          </div>

          <textarea
            className="code-editor"
            defaultValue={`function twoSum(nums, target) {
  
}`}
          />

        </div>
      </div>
    </section>
  );
}

export default Battle;