import React, { useState } from 'react';
import {
  Play,
  Send,
  ShieldAlert,
  Clock,
  Terminal,
  Users
} from 'lucide-react';
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
export default function ArenaUI() {
  const [playerCount, setPlayerCount] = useState(4); // Toggle 1, 2, 3, or 4 players

  // Dummy Opponent Data
  const opponents = [
    { id: 2, name: "Cypher_X", progress: 80, tests: "8/10", status: "Coding...", color: "border-purple-500 text-purple-400" },
    { id: 3, name: "ByteMaster", progress: 40, tests: "4/10", status: "Debugging", color: "border-rose-500 text-rose-400" },
    { id: 4, name: "NullPointer", progress: 90, tests: "9/10", status: "Executing", color: "border-amber-500 text-amber-400" },
  ];

  return (
    <div className="h-screen w-screen bg-[#0b0e14] text-slate-200 flex flex-col font-sans overflow-hidden select-none">
      
      {/* 1. TOP BAR / ARENA HEADER */}
      <header className="h-16 border-b border-slate-800 bg-[#0d1117] px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f0ff]" />
          <h1 className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            CODING BATTLEGROUND
          </h1>
        </div>

        {/* Global Match Clock */}
        <div className="flex items-center space-x-2 bg-slate-900/80 px-4 py-1.5 rounded-full border border-slate-700">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="font-mono font-bold text-lg text-slate-100">14:58</span>
        </div>

        {/* Match Controls & Player Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
            <Users className="w-4 h-4 mr-2 ml-1 text-slate-400" />
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => setPlayerCount(num)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  playerCount === num ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/50' : 'text-slate-400 hover:text-white'
                }`}
              >
                {num}P
              </button>
            ))}
          </div>
          
          <button className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2 rounded-lg font-bold text-slate-950 text-sm shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all">
            <Send className="w-4 h-4 fill-current" />
            <span>SUBMIT CODE</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN BATTLE ARENA (GRID) */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-3 overflow-hidden">
        
        {/* LEFT PANEL: Problem Details & Test Cases */}
        <div className="col-span-4 bg-[#12161f] border border-slate-800/80 rounded-xl flex flex-col overflow-hidden">
          <div className="bg-slate-900/60 p-3 border-b border-slate-800 font-semibold text-xs tracking-wider text-slate-400 uppercase flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2 text-cyan-400" /> Challenge Objective
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4 text-sm text-slate-300">
            <h2 className="text-lg font-bold text-white">1. Two-Sum Multiplier Matrix</h2>
            <p className="leading-relaxed text-xs text-slate-400">
              Given an array of integers <code className="bg-slate-800 px-1 py-0.5 rounded text-cyan-300">nums</code> and an integer target, return indices of the two numbers such that they add up to target.
            </p>
            
            {/* Example Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-2 text-xs font-mono">
              <span className="text-slate-400">Input:</span> <span className="text-purple-300">nums = [2,7,11,15], target = 9</span><br/>
              <span className="text-slate-400">Output:</span> <span className="text-emerald-400">[0,1]</span>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Code Editor Interface */}
        <div className="col-span-8 flex flex-col gap-2 overflow-hidden">
          <div className="flex-1 bg-[#0d1117] border border-slate-800 rounded-xl flex flex-col overflow-hidden relative">
            
            {/* Editor Header */}
            <div className="bg-slate-900/40 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">main.py (Player 1 - You)</span>
              <button className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded hover:bg-emerald-900/50">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Tests</span>
              </button>
            </div>

            {/* Mock Code Editor Area */}
            <div className="flex-1 p-4 font-mono text-sm leading-relaxed overflow-y-auto bg-[#0a0d12]">
              <div className="flex">
                <span className="w-8 select-none text-slate-600 text-right pr-4">1</span>
                <span className="text-purple-400">def</span> <span className="text-blue-400">twoSum</span>(self, nums: List[int], target: int) -&gt; List[int]:
              </div>
              <div className="flex">
                <span className="w-8 select-none text-slate-600 text-right pr-4">2</span>
                <span className="pl-4 text-slate-400"># Implement optimal dynamic lookup table</span>
              </div>
              <div className="flex">
                <span className="w-8 select-none text-slate-600 text-right pr-4">3</span>
                <span className="pl-4 text-slate-100">seen = {}</span>
              </div>
              <div className="flex bg-cyan-950/30 -mx-4 px-4 border-l-2 border-cyan-400">
                <span className="w-8 select-none text-slate-600 text-right pr-4">4</span>
                <span className="pl-4 text-purple-400">for</span> <span className="text-slate-100">i, num</span> <span className="text-purple-400">in</span> <span className="text-blue-400">enumerate</span>(nums):
              </div>
            </div>

            {/* Bottom Console / Output */}
            <div className="h-28 border-t border-slate-800 bg-[#0c0f14] p-3 font-mono text-xs flex flex-col">
              <div className="flex items-center space-x-2 text-slate-500 mb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Execution Output</span>
              </div>
              <div className="text-emerald-400">✔ Test case 1 passed (12ms)</div>
              <div className="text-emerald-400">✔ Test case 2 passed (8ms)</div>
              <div className="text-slate-500">Waiting for full suite execution...</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM RIVALS TELEMETRY TRAY (Shows for 2, 3, or 4 Players) */}
      {playerCount > 1 && (
        <div className="h-24 bg-[#0d1117] border-t border-slate-800 px-4 py-2 grid grid-cols-3 gap-3">
          {opponents.slice(0, playerCount - 1).map((opp) => (
            <div key={opp.id} className={`bg-slate-900/60 border rounded-lg p-2.5 flex flex-col justify-between ${opp.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs tracking-wide">{opp.name}</span>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {opp.tests} Passed
                </span>
              </div>

              {/* Rival Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-current h-full transition-all duration-500" 
                  style={{ width: `${opp.progress}%` }} 
                />
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Status: {opp.status}</span>
                <span>Speed: 74 WPM</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
