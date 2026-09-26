"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

export default function FieldCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const [study, setStudy] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(-1); // -1 is consent, 0+ is question index
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    // In a real app we would have an endpoint specifically for collectors to fetch study definition
    fetch(`/api/studies/${params.id}`)
      .then(r => r.json())
      .then(d => { if (d.study) setStudy(d.study); })
      .catch(console.error);
  }, [params.id]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => {
        let textValue = null;
        let numberValue = null;
        if (typeof val === 'number') numberValue = val;
        else textValue = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return { questionId: qId, textValue, numberValue };
      });

      const res = await fetch(`/api/studies/${params.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionMethod: "FIELD_COLLECTED",
          answers: formattedAnswers
        })
      });

      if (res.ok) {
        alert("Response recorded successfully!");
        setAnswers({});
        setCurrentStep(-1);
        setConsentGiven(false);
      } else {
        alert("Failed to submit response.");
      }
    } catch (e) {
      alert("Error submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!study) return <div className="p-8 text-center">Loading Study...</div>;

  const questions = study.questions || [];
  const isDone = currentStep >= questions.length;
  const progress = Math.round(((currentStep + 1) / (questions.length + 1)) * 100);

  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6 max-w-lg mx-auto">
        <div className="flex-1 flex flex-col justify-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Participant Consent</h1>
          <p className="text-center text-gray-600 mb-8 px-4">
            Before continuing, confirm that the participant has received the study information and has agreed to participate.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-8 flex gap-3 text-orange-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Do not proceed without verbal or written consent according to the researcher's protocol.</p>
          </div>

          <button 
            onClick={() => { setConsentGiven(true); setCurrentStep(0); }}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md active:scale-[0.98]"
          >
            Participant has consented
          </button>
          
          <button 
            onClick={() => router.push("/collector/dashboard")}
            className="w-full mt-4 text-gray-500 py-4 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-white flex flex-col p-6 max-w-lg mx-auto">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Ready to Submit</h1>
          <p className="text-gray-600 mb-10 text-lg">
            You have completed all questions for this participant.
          </p>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg transition shadow-md ${
              isSubmitting ? "opacity-50" : "hover:bg-emerald-700 active:scale-[0.98]"
            }`}
          >
            {isSubmitting ? "Saving locally/syncing..." : "Submit Response"}
          </button>
          
          <button 
            onClick={() => setCurrentStep(questions.length - 1)}
            className="w-full mt-4 text-gray-500 py-4 font-medium"
          >
            Review Answers
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentStep];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Top Progress */}
      <div className="bg-white p-4 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex items-center gap-4">
        <button onClick={() => setCurrentStep(c => c - 1)} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
            <span>Question {currentStep + 1} of {questions.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 leading-tight">{q.text}</h2>
        
        {/* Large Mobile Inputs based on type */}
        <div className="space-y-3">
          {q.type === "SINGLE_CHOICE" || q.type === "YES_NO" ? (
            q.options?.map((opt: any) => (
              <button
                key={opt.id}
                onClick={() => {
                  setAnswers({ ...answers, [q.id]: opt.value });
                  setTimeout(() => setCurrentStep(c => c + 1), 300); // Auto-advance
                }}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all font-medium text-lg ${
                  answers[q.id] === opt.value 
                    ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm" 
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 active:bg-gray-50"
                }`}
              >
                {opt.text}
              </button>
            ))
          ) : q.type === "NUMBER" ? (
            <input
              type="number"
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: Number(e.target.value) })}
              className="w-full p-5 text-2xl rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-0 bg-white"
              placeholder="Enter number..."
            />
          ) : (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
              className="w-full p-5 text-lg rounded-xl border-2 border-gray-200 focus:border-blue-600 focus:ring-0 bg-white h-40 resize-none"
              placeholder="Type answer here..."
            />
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="p-4 bg-white border-t border-gray-200">
        <button
          onClick={() => setCurrentStep(c => c + 1)}
          disabled={q.required && !answers[q.id]}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition shadow-sm ${
            q.required && !answers[q.id]
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-gray-900 text-white hover:bg-black active:scale-[0.98]"
          }`}
        >
          {currentStep === questions.length - 1 ? "Review" : "Next Question"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
