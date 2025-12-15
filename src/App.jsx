import React, { useState } from "react";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});


function App() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const handleAddManual = () => {
    if (!title || !description || !amount || !date) return;
    const newExpense = {
      title,
      description,
      amount: parseFloat(amount),
      date: new Date(date),
    };
    setExpenses([...expenses, newExpense]);
    setTitle("");
    setDescription("");
    setAmount("");
    setDate("");
  };

  const handleAddAI = async () => {
    if (!aiInput) return;

    setLoading(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const prompt = `
You are a JSON API.

Return ONLY valid JSON.
Do not include explanation, text, or markdown.

Schema:
{
  "Title": string,
  "Description": string,
  "Amount": number,
  "Date": "YYYY-MM-DD"
}

Text: "${aiInput}"

If date is missing, use ${today}
`;


      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const rawText = response.text;
      console.log("AI Raw Response:", rawText);

      const cleanedResponse = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const data = JSON.parse(cleanedResponse);

      const newExpense = {
        title: data.Title || "No Title",
        description: data.Description || "No Description",
        amount: Number(data.Amount) || 0,
        date: data.Date ? new Date(data.Date) : new Date(),
      };

      setExpenses((prev) => [...prev, newExpense]);
      setAiInput("");
    } catch (error) {
      console.error("Error processing AI input:", error);
      alert("AI response could not be parsed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Expense Tracker</h1>

      <div className="border p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Expense Manually</h2>

        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 w-full mb-2"
        />

        <input
          type="text"
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

      <div className="border p-4 mb-6">
        <h2 className="text-xl font-semibold mb-2">Add Expense via AI</h2>

        <input
          type="text"
          placeholder="e.g. 100 rupees for groceries on 5th May"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          className="border p-2 w-full mb-4"
        />

        <button
          onClick={handleAddAI}
          disabled={loading}
          className="bg-green-500 text-white p-2 w-full"
        >
          {loading ? "Processing..." : "Process with AI"}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Expenses</h2>

        {expenses.length === 0 ? (
          <p>No expenses added yet.</p>
        ) : (
          <ul>
            {expenses.map((expense, index) => (
              <li key={index} className="border-b py-2">
                <strong>{expense.title}</strong> – {expense.description} – $
                {expense.amount.toFixed(2)} on{" "}
                {expense.date.toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
