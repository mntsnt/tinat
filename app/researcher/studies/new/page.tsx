"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  text: string;
  type: string;
  required: boolean;
  options: string[];
};

export default function CreateStudyPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [rewardCredits, setRewardCredits] =
    useState(5);

  const [participantTarget, setParticipantTarget] =
    useState(10);

  const [questions, setQuestions] = useState<Question[]>([
    {
      text: "",
      type: "SHORT_TEXT",
      required: true,
      options: [],
    },
  ]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const budgetCredits =
    rewardCredits * participantTarget;

  function addQuestion() {
    setQuestions([
      ...questions,
      {
        text: "",
        type: "SHORT_TEXT",
        required: true,
        options: [],
      },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions(
      questions.filter((_, i) => i !== index)
    );
  }

  function updateQuestion(
    index: number,
    field: keyof Question,
    value: string | boolean | string[]
  ) {
    const updated = [...questions];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setQuestions(updated);
  }

  async function handleSubmit() {
    setError("");

    if (!title.trim()) {
      setError("Please enter a study title.");
      return;
    }

    if (rewardCredits <= 0) {
      setError("Reward must be greater than 0.");
      return;
    }

    if (participantTarget <= 0) {
      setError(
        "Participant target must be greater than 0."
      );
      return;
    }

    if (
      questions.some(
        (question) => !question.text.trim()
      )
    ) {
      setError("Every question needs text.");
      return;
    }

    for (const question of questions) {
      if (
        question.type === "SINGLE_CHOICE" ||
        question.type === "MULTIPLE_CHOICE"
      ) {
        if (
          question.options.length === 0 ||
          question.options.some(
            (option) => !option.trim()
          )
        ) {
          setError(
            `Please add valid options for "${question.text}".`
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/studies",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            description,
            rewardCredits,
            participantTarget,
            budgetCredits,
            questions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to create study."
        );
        return;
      }

      router.push(
        `/researcher/studies/${data.study.id}`
      );

      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1>Create Research Study</h1>

      <section>
        <label>Study title</label>

        <br />

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Enter study title"
        />
      </section>

      <br />

      <section>
        <label>Description</label>

        <br />

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Describe your research"
        />
      </section>

      <br />

      <section>
        <h2>Study Funding</h2>

        <label>
          Reward per participant
        </label>

        <br />

        <input
          type="number"
          min="1"
          value={rewardCredits}
          onChange={(e) =>
            setRewardCredits(
              Number(e.target.value)
            )
          }
        />

        <span> TC</span>

        <br />
        <br />

        <label>
          Number of participants
        </label>

        <br />

        <input
          type="number"
          min="1"
          value={participantTarget}
          onChange={(e) =>
            setParticipantTarget(
              Number(e.target.value)
            )
          }
        />

        <div>
          <p>
            <strong>Funding summary</strong>
          </p>

          <p>
            {participantTarget} participants ×{" "}
            {rewardCredits} TC
          </p>

          <p>
            Total budget:{" "}
            <strong>
              {budgetCredits} TC
            </strong>
          </p>
        </div>
      </section>

      <hr />

      <h2>Questions</h2>

      {questions.map(
        (question, index) => (
          <section key={index}>
            <h3>
              Question {index + 1}
            </h3>

            <input
              value={question.text}
              onChange={(e) =>
                updateQuestion(
                  index,
                  "text",
                  e.target.value
                )
              }
              placeholder="Write your question"
            />

            <br />
            <br />

            <select
              value={question.type}
              onChange={(e) =>
                updateQuestion(
                  index,
                  "type",
                  e.target.value
                )
              }
            >
              <option value="SHORT_TEXT">
                Short answer
              </option>

              <option value="LONG_TEXT">
                Long answer
              </option>

              <option value="NUMBER">
                Number
              </option>

              <option value="YES_NO">
                Yes / No
              </option>

              <option value="SINGLE_CHOICE">
                Single choice
              </option>

              <option value="MULTIPLE_CHOICE">
                Multiple choice
              </option>

              <option value="DATE">
                Date
              </option>
            </select>

            <br />

            <label>
              <input
                type="checkbox"
                checked={
                  question.required
                }
                onChange={(e) =>
                  updateQuestion(
                    index,
                    "required",
                    e.target.checked
                  )
                }
              />

              {" "}Required
            </label>

            {(
              question.type ===
                "SINGLE_CHOICE" ||
              question.type ===
                "MULTIPLE_CHOICE"
            ) && (
              <div>
                <h4>Options</h4>

                {question.options.map(
                  (option, optionIndex) => (
                    <div
                      key={optionIndex}
                    >
                      <input
                        value={option}
                        placeholder={`Option ${
                          optionIndex + 1
                        }`}
                        onChange={(e) => {
                          const options = [
                            ...question.options,
                          ];

                          options[
                            optionIndex
                          ] = e.target.value;

                          updateQuestion(
                            index,
                            "options",
                            options
                          );
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const options =
                            question.options.filter(
                              (_, i) =>
                                i !==
                                optionIndex
                            );

                          updateQuestion(
                            index,
                            "options",
                            options
                          );
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

                <button
                  type="button"
                  onClick={() => {
                    updateQuestion(
                      index,
                      "options",
                      [
                        ...question.options,
                        "",
                      ]
                    );
                  }}
                >
                  + Add Option
                </button>
              </div>
            )}

            {questions.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  removeQuestion(index)
                }
              >
                Remove Question
              </button>
            )}
          </section>
        )
      )}

      <br />

      <button
        type="button"
        onClick={addQuestion}
      >
        + Add Question
      </button>

      {error && (
        <p>
          <strong>{error}</strong>
        </p>
      )}

      <br />
      <br />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "Creating..."
          : "Create Study"}
      </button>
    </main>
  );
}
