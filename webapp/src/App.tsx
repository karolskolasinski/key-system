import { useState } from "react";

const App = () => {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("strongpassword123");
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setResponse("Błąd podczas wysyłania zapytania");
    }
  };

  return (
    <div className="flex flex-col items-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-80">
        <h1 className="font-bold text-2xl">Login</h1>
        <input
          className="border border-dashed p-2"
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-dashed p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="py-2.5 px-6 text-sm bg-indigo-50 text-indigo-500 rounded-lg cursor-pointer font-semibold text-center shadow-xs transition-all duration-500 hover:bg-indigo-100"
        >
          Submit
        </button>
      </form>

      {response && (
        <pre className="mt-4 p-2 bg-gray-100 border border-gray-300 rounded text-sm">
          {response}
        </pre>
      )}
    </div>
  );
};

export default App;
