"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  text: string;
  value: string;
  order: number;
};

type Question = {
  id: string;
  text: string;
  type:
    | "SHORT_TEXT"
    | "LONG_TEXT"
    | "SINGLE_CHOICE"
    | "MULTIPLE_CHOICE"
    | "NUMBER"
    | "YES_NO"
    | "DATE";
  required: boolean;
  options: Option[];
};

type Study = {
  id: string;
  title: string;
  description: string | null;
  rewardCredits: number;
  researcher: {
    name: string;
  };
  questions: Question[];
};

type SubmitResponse = {
  message?: string;
  error?: string;
  creditsEarned?: number;
  newBalance?: number;
};

export default function StudyQuestionnaire({
  study,
}: {
  study: Study;
}) {
  const router = useRouter();

  const [answers, setAnswers] = useState<
    Record<string, string | string[]>
  >({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateAnswer(
    questionId: string,
    value: string | string[]
  ) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));

    // Clear an old error when the participant starts fixing answers.
    if (error) {
      setError("");
    }
  }

  function handleMultipleChoice(
    questionId: string,
    value: string
  ) {
    const current = answers[questionId];

    const selected = Array.isArray(current)
      ? current
      : [];

    if (selected.includes(value)) {
      updateAnswer(
        questionId,
        selected.filter((item) => item !== value)
      );
    } else {
      updateAnswer(questionId, [
        ...selected,
        value,
      ]);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading || submitted) {
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/auth/studies/${study.id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers,
          }),
        }
      );

      let data: SubmitResponse = {};

      try {
        data =
          (await response.json()) as SubmitResponse;
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to submit your response."
        );
        return;
      }

      setSubmitted(true);

      setSuccess(
        `Research completed successfully! You earned ${
          data.creditsEarned ?? study.rewardCredits
        } Tinat Credits.`
      );

      /*
       * Give the participant a moment to see
       * the success message before returning
       * to the dashboard.
       */
      setTimeout(() => {
        router.push("/participant");
        router.refresh();
      }, 1800);
    } catch (caughtError) {
      console.error(
        "Study submission error:",
        caughtError
      );

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong while submitting."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderQuestion(question: Question) {
    const value = answers[question.id];

    switch (question.type) {
      case "LONG_TEXT":
        return (
          <textarea
            value={
              typeof value === "string"
                ? value
                : ""
            }
            onChange={(event) =>
              updateAnswer(
                question.id,
                event.target.value
              )
            }
            rows={6}
            disabled={loading || submitted}
          />
        );

      case "NUMBER":
        return (
          <input
            type="number"
            value={
              typeof value === "string"
                ? value
                : ""
            }
            onChange={(event) =>
              updateAnswer(
                question.id,
                event.target.value
              )
            }
            disabled={loading || submitted}
          />
        );

      case "DATE":
        return (
          <input
            type="date"
            value={
              typeof value === "string"
                ? value
                : ""
            }
            onChange={(event) =>
              updateAnswer(
                question.id,
                event.target.value
              )
            }
            disabled={loading || submitted}
          />
        );

      case "YES_NO":
        return (
          <div>
            <label>
              <input
                type="radio"
                name={question.id}
                value="Yes"
                checked={value === "Yes"}
                onChange={(event) =>
                  updateAnswer(
                    question.id,
                    event.target.value
                  )
                }
                disabled={loading || submitted}
              />
              {" "}Yes
            </label>

            <br />

            <label>
              <input
                type="radio"
                name={question.id}
                value="No"
                checked={value === "No"}
                onChange={(event) =>
                  updateAnswer(
                    question.id,
                    event.target.value
                  )
                }
                disabled={loading || submitted}
              />
              {" "}No
            </label>
          </div>
        );

      case "SINGLE_CHOICE":
        return (
          <div>
            {question.options.map((option) => (
              <div key={option.id}>
                <label>
                  <input
                    type="radio"
                    name={question.id}
                    value={option.value}
                    checked={
                      value === option.value
                    }
                    onChange={(event) =>
                      updateAnswer(
                        question.id,
                        event.target.value
                      )
                    }
                    disabled={
                      loading || submitted
                    }
                  />
                  {" "}
                  {option.text}
                </label>
              </div>
            ))}
          </div>
        );

      case "MULTIPLE_CHOICE":
        return (
          <div>
            {question.options.map((option) => {
              const selected =
                Array.isArray(value)
                  ? value
                  : [];

              return (
                <div key={option.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(
                        option.value
                      )}
                      onChange={() =>
                        handleMultipleChoice(
                          question.id,
                          option.value
                        )
                      }
                      disabled={
                        loading || submitted
                      }
                    />
                    {" "}
                    {option.text}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case "SHORT_TEXT":
      default:
        return (
          <input
            type="text"
            value={
              typeof value === "string"
                ? value
                : ""
            }
            onChange={(event) =>
              updateAnswer(
                question.id,
                event.target.value
              )
            }
            disabled={loading || submitted}
          />
        );
    }
  }

  return (
    <main>
      <h1>{study.title}</h1>

      {study.description && (
        <p>{study.description}</p>
      )}

      <p>
        Researcher:{" "}
        <strong>{study.researcher.name}</strong>
      </p>

      <p>
        Reward:{" "}
        <strong>
          {study.rewardCredits} Tinat Credits
        </strong>
      </p>

      <hr />

      {success && (
        <section>
          <h2>Submission Successful</h2>
          <p>{success}</p>
          <p>
            Returning to your participant dashboard...
          </p>
        </section>
      )}

      {error && (
        <section>
          <p>
            <strong>Error:</strong> {error}
          </p>
        </section>
      )}

      {!submitted && (
        <form onSubmit={handleSubmit}>
          {study.questions.map(
            (question, index) => (
              <section key={question.id}>
                <h3>
                  {index + 1}. {question.text}
                  {question.required && " *"}
                </h3>

                {renderQuestion(question)}
              </section>
            )
          )}

          <br />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : `Submit & Earn ${study.rewardCredits} TC`}
          </button>
        </form>
      )}

      {!submitted && (
        <>
          <br />
          <br />

          <button
            type="button"
            onClick={() =>
              router.push("/participant")
            }
            disabled={loading}
          >
            ← Back to Studies
          </button>
        </>
      )}
    </main>
  );
}