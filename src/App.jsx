import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";

function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [expenses, setExpenses] = useState([]);

  // Gemini client (Vite env variable)
  const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  });

  /* ------------------ MANUAL ADD ------------------ */
  const handleAddManual = () => {
    if (!title || !description || !amount || !date) return;

    setExpenses((prev) => [
      ...prev,
      {
        title,
        description,
        amount: Number(amount),
        date: new Date(date),
      },
    ]);

    setTitle("");
    setDescription("");
    setAmount("");
    setDate("");
  };

  /* ------------------ VOICE INPUT ------------------ */
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice recognition not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(transcript);

      // Auto process after voice
      setTimeout(() => handleAddAI(transcript), 400);
    };

    recognition.onerror = () => setListening(false);

    recognition.start();
  };

  /* ------------------ AI ADD ------------------ */
  const handleAddAI = async (inputText) => {
    const text = inputText || aiInput;
    if (!text) return;

    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const prompt = `
Return ONLY valid JSON.

{
  "Title": "",
  "Description": "",
  "Amount": number,
  "Date": "YYYY-MM-DD"
}

Text: "${text}"
If date is missing, use ${today}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const rawText = response.text;

      const cleaned = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleaned);

      setExpenses((prev) => [
        ...prev,
        {
          title: data.Title || "Unknown",
          description: data.Description || "No description",
          amount: Number(data.Amount) || 0,
          date: new Date(data.Date || today),
        },
      ]);

      setAiInput("");
    } catch (error) {
      console.error(error);
      alert("AI response could not be parsed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        AI Expense Tracker (Gemini + Voice)
      </h1>

      {/* MANUAL */}
      <div className="border p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Add Expense Manually
        </h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full mb-2"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 w-full mb-4"
        />

        <button
          onClick={handleAddManual}
          className="bg-blue-500 text-white p-2 w-full"
        >
          Add Expense
        </button>
      </div>

      {/* AI */}
      <div className="border p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Add Expense via AI / Voice
        </h2>

        <div className="flex gap-2 mb-4">
          <input
            placeholder="Type or speak your expense"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            className="border p-2 flex-1"
          />
          <button
            onClick={handleVoiceInput}
            className={`px-4 rounded text-white ${
              listening ? "bg-red-500" : "bg-gray-700"
            }`}
          >
            🎤
          </button>
        </div>

        <button
          onClick={() => handleAddAI()}
          disabled={loading}
          className="bg-green-500 text-white p-2 w-full"
        >
          {loading ? "Processing..." : "Process with AI"}
        </button>
      </div>

      {/* LIST */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Expenses</h2>
        {expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          <ul>
            {expenses.map((e, i) => (
              <li key={i} className="border-b py-2">
                <strong>{e.title}</strong> – {e.description} – ₹
                {e.amount.toFixed(2)} on{" "}
                {e.date.toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
