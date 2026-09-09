import React, { useState } from "react";
import {
  ArrowLeft,
  Check,
  Play,
  Code2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const questions = [
  {
    id: 1,
    title: "Two Sum",
    difficulty: "Easy",
    description:
      "Find two numbers in an array whose sum is equal to the target.",
  },
  {
    id: 2,
    title: "Palindrome String",
    difficulty: "Easy",
    description:
      "Check whether a given string reads the same forward and backward.",
  },
  {
    id: 3,
    title: "Maximum Subarray",
    difficulty: "Medium",
    description:
      "Find the contiguous subarray with the largest possible sum.",
  },
  {
    id: 4,
    title: "Binary Search",
    difficulty: "Medium",
    description:
      "Search for an element in a sorted array using binary search.",
  },
  {
    id: 5,
    title: "Longest Substring",
    difficulty: "Medium",
    description:
      "Find the longest substring without repeating characters.",
  },
  {
    id: 6,
    title: "Merge Intervals",
    difficulty: "Hard",
    description:
      "Merge all overlapping intervals from a given collection.",
  },
];

export default function QuestionSelection() {
  const navigate = useNavigate();

  const [selectedQuestions, setSelectedQuestions] = useState([]);

  // ============================================================
  // GET ACTIVE ROOM CODE
  // ============================================================

  const getRoomCode = () => {
    const savedRoomCode =
      localStorage.getItem("roomCode");

    if (savedRoomCode) {
      return savedRoomCode.toUpperCase();
    }

    try {
      const storedRoom =
        localStorage.getItem("battleRoom");

      if (!storedRoom) {
        return "";
      }

      const room = JSON.parse(storedRoom);

      return (
        room.roomCode ||
        room.code ||
        ""
      ).toUpperCase();
    } catch (error) {
      console.error(
        "Unable to read battle room:",
        error
      );

      return "";
    }
  };

  const roomCode = getRoomCode();

  // ============================================================
  // TOGGLE QUESTION
  // ============================================================

  const toggleQuestion = (question) => {
    setSelectedQuestions((previous) => {
      const alreadySelected =
        previous.some(
          (item) => item.id === question.id
        );

      // Remove question
      if (alreadySelected) {
        return previous.filter(
          (item) => item.id !== question.id
        );
      }

      // Maximum 5
      if (previous.length >= 5) {
        alert(
          "You can select a maximum of 5 questions."
        );

        return previous;
      }

      // Add question
      return [
        ...previous,
        question,
      ];
    });
  };

  // ============================================================
  // START BATTLE
  // ============================================================

  const startBattle = () => {
    // ----------------------------------------------------------
    // ROOM CHECK
    // ----------------------------------------------------------

    if (!roomCode) {
      alert(
        "Battle room not found. Please return to the Battle Lobby."
      );

      navigate("/battle-lobby");

      return;
    }

    // ----------------------------------------------------------
    // QUESTION CHECK
    // ----------------------------------------------------------

    if (selectedQuestions.length === 0) {
      alert(
        "Please select at least one question."
      );

      return;
    }

    // ----------------------------------------------------------
    // SAVE SELECTED QUESTIONS
    // ----------------------------------------------------------

    localStorage.setItem(
      "battleQuestions",
      JSON.stringify(selectedQuestions)
    );

    // ----------------------------------------------------------
    // SAVE ROOM CODE
    // ----------------------------------------------------------

    localStorage.setItem(
      "roomCode",
      roomCode
    );

    // ----------------------------------------------------------
    // MARK BATTLE AS STARTED
    // ----------------------------------------------------------

    localStorage.setItem(
      "battleStarted",
      "true"
    );

    // ----------------------------------------------------------
    // SAVE CURRENT QUESTION
    // ----------------------------------------------------------

    localStorage.setItem(
      "currentQuestionIndex",
      "0"
    );

    // ----------------------------------------------------------
    // DEBUG
    // ----------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "BATTLE STARTING"
    );

    console.log(
      "Room:",
      roomCode
    );

    console.log(
      "Questions:",
      selectedQuestions
    );

    console.log(
      "Battle Started:",
      localStorage.getItem(
        "battleStarted"
      )
    );

    console.log(
      "========================================"
    );

    // ----------------------------------------------------------
    // GO TO ACTUAL MATCH
    //
    // IMPORTANT:
    //
    // DO NOT USE:
    //
    // navigate(`/battle/${roomCode}`)
    //
    // That route is the waiting room.
    //
    // The actual coding battle uses:
    //
    // /battle/:roomCode/match
    // ----------------------------------------------------------

    navigate(
      `/battle/${roomCode}/match`
    );
  };

  // ============================================================
  // BACK
  // ============================================================

  const goBack = () => {
    if (roomCode) {
      navigate(
        `/battle/${roomCode}`
      );
    } else {
      navigate("/battle-lobby");
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="question-selection-page">

      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="question-selection-header">

        {/* BACK BUTTON */}

        <button
          className="question-back-btn"
          onClick={goBack}
        >
          <ArrowLeft size={16} />

          Back
        </button>


        {/* TITLE */}

        <div className="question-title">

          <Code2 size={24} />

          <div>

            <h1>
              Select Battle Questions
            </h1>

            <p>
              Host can select up to 5 questions
              for this battle.
            </p>

          </div>

        </div>


        {/* SELECTED COUNTER */}

        <div className="selected-counter">

          {selectedQuestions.length}/5 Selected

        </div>

      </header>


      {/* ======================================================
          CONTENT
          ====================================================== */}

      <main className="question-selection-content">

        {/* INFORMATION */}

        <div className="question-info">

          <div>

            <h2>
              Choose Your Challenges
            </h2>

            <p>
              Select the programming questions
              that players will solve during
              the battle.
            </p>

          </div>


          {/* ROOM CODE */}

          {roomCode && (

            <div className="question-room-code">

              <span>
                ROOM
              </span>

              <strong>
                {roomCode}
              </strong>

            </div>

          )}

        </div>


        {/* ====================================================
            QUESTION CARDS
            ==================================================== */}

        <div className="questions-grid">

          {questions.map((question) => {

            const selected =
              selectedQuestions.some(
                (item) =>
                  item.id === question.id
              );

            return (

              <div
                key={question.id}
                className={`question-card ${
                  selected
                    ? "question-selected"
                    : ""
                }`}
                onClick={() =>
                  toggleQuestion(question)
                }
              >

                {/* TOP */}

                <div className="question-card-top">

                  <div className="question-number">
                    {question.id}
                  </div>

                  <span
                    className={`difficulty ${question.difficulty.toLowerCase()}`}
                  >
                    {question.difficulty}
                  </span>

                </div>


                {/* TITLE */}

                <h3>
                  {question.title}
                </h3>


                {/* DESCRIPTION */}

                <p>
                  {question.description}
                </p>


                {/* SELECT */}

                <div className="question-select">

                  <div
                    className={`checkbox ${
                      selected
                        ? "checkbox-selected"
                        : ""
                    }`}
                  >

                    {selected && (
                      <Check size={14} />
                    )}

                  </div>

                  <span>
                    {selected
                      ? "Selected"
                      : "Select Question"}
                  </span>

                </div>

              </div>

            );
          })}

        </div>

      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="question-selection-footer">

        {/* SELECTED COUNT */}

        <div>

          Selected questions:{" "}

          <strong>
            {selectedQuestions.length}
          </strong>

        </div>


        {/* START BUTTON */}

        <button
          className="start-battle-btn"
          onClick={startBattle}
          disabled={
            selectedQuestions.length === 0
          }
        >

          <Play
            size={16}
            fill="currentColor"
          />

          Start Battle

        </button>

      </footer>

    </div>
  );
}
