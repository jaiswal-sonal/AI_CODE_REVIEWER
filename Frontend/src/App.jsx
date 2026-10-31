import { useState, useRef, useEffect, useCallback } from 'react'
import "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-java";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-go";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism-tomorrow.css"
import Editor from "react-simple-code-editor"
import axios from "axios"
import prism from "prismjs"
import rehypeHighlight from 'rehype-highlight';
import "highlight.js/styles/github-dark.css";
import Markdown from "react-markdown"
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const LANGUAGES = {
  javascript: { label: "JavaScript", sample: `function sum(a, b) {\n  return a + b\n}\n\nconsole.log(sum(2, 3))` },
  java: { label: "Java", sample: `public class Main {\n    public static void main(String[] args) {\n        int n = 7;\n        boolean prime = true;\n        for (int i = 2; i < n; i++) {\n            if (n % i == 0) prime = false;\n        }\n        if (prime = true) System.out.println("Prime");\n    }\n}` },
  python: { label: "Python", sample: `def avg(nums):\n    total = 0\n    for n in nums:\n        total += n\n    return total / len(nums)\n\nprint(avg([]))` },
  cpp: { label: "C++", sample: `#include <iostream>\nint main() {\n    int arr[3] = {1, 2, 3};\n    for (int i = 0; i <= 3; i++) std::cout << arr[i];\n}` },
  typescript: { label: "TypeScript", sample: `function getUser(id: number) {\n  const users: any = [];\n  return users.find((u) => u.id == id).name;\n}` },
  go: { label: "Go", sample: `package main\n\nimport "fmt"\n\nfunc main() {\n\tvar m map[string]int\n\tm["a"] = 1\n\tfmt.Println(m)\n}` },
  sql: { label: "SQL", sample: `SELECT * FROM users WHERE name = '" + userName + "';\nDELETE FROM orders;` },
  c: { label: "C", sample: `#include <stdio.h>\nint main() {\n    char *s;\n    scanf("%s", s);\n    printf("%s", s);\n}` },
};

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ } },
};

function App() {
  const [lang, setLang] = useState("javascript");
  const [code, setCode] = useState(LANGUAGES.javascript.sample);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(() => store.get("theme", "dark"));
  const [history, setHistory] = useState(() => store.get("review-history", []));
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    store.set("theme", theme);
  }, [theme]);

  useEffect(() => { store.set("review-history", history); }, [history]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  function typeOut(text) {
    clearInterval(timerRef.current);
    let index = 0;
    timerRef.current = setInterval(() => {
      index += 10;
      setReview(text.slice(0, index));
      if (index >= text.length) clearInterval(timerRef.current);
    }, 15);
  }

  const reviewCode = useCallback(async () => {
    if (loading || !code.trim()) return;
    clearInterval(timerRef.current);
    setLoading(true); setReview(""); setError("");
    try {
      const { data } = await axios.post(`${API_URL}/ai/get-review`, {
        code: `Language: ${LANGUAGES[lang].label}\n\n${code}`,
      });
      const text = typeof data === "string" ? data : JSON.stringify(data);
      typeOut(text);
      setHistory((prev) => [
        { id: Date.now(), time: new Date().toLocaleString(), lang, code, review: text },
        ...prev,
      ].slice(0, 20));
    } catch (err) {
      setError(typeof err.response?.data === "string"
        ? err.response.data
        : "Backend se connect nahi ho paya. Check karo ki server chal raha hai.");
    } finally {
      setLoading(false);
    }
  }, [code, lang, loading]);

  // Ctrl/Cmd + Enter se review
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") reviewCode(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewCode]);

  function changeLang(next) {
    // sample code hi hai to naye language ka sample dikhao, warna user ka code rehne do
    const isSample = Object.values(LANGUAGES).some((l) => l.sample === code);
    setLang(next);
    if (isSample || !code.trim()) setCode(LANGUAGES[next].sample);
  }

  function openHistory(item) {
    clearInterval(timerRef.current);
    setLang(item.lang); setCode(item.code); setReview(item.review); setError("");
    setShowHistory(false);
  }

  async function copyReview() {
    try {
      await navigator.clipboard.writeText(review);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard allowed nahi */ }
  }

  const grammar = prism.languages[lang] || prism.languages.javascript;
  const lines = code.split("\n").length;
  const status = loading ? ["busy", "Reviewing…"] : error ? ["err", "Error"] : review ? ["ok", "Review ready"] : ["", "Ready"];

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">{"</>"}</div>
          <div>
            <h1>AI Code Reviewer</h1>
            <p>Instant, Gemini-powered code review</p>
          </div>
        </div>
        <div className="header-actions">
          <div className={`badge ${status[0]}`}><span className="dot" />{status[1]}</div>
          <button className="btn" onClick={() => setShowHistory(true)}>🕘 History{history.length ? ` (${history.length})` : ""}</button>
          <button className="btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">Code <small>input</small></div>
            <div className="actions">
              <select value={lang} onChange={(e) => changeLang(e.target.value)} aria-label="Language">
                {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button className="btn" onClick={() => setCode(LANGUAGES[lang].sample)}>Sample</button>
              <button className="btn" onClick={() => setCode("")} disabled={!code}>Clear</button>
            </div>
          </div>
          <div className="editor-wrap">
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={(c) => prism.highlight(c, grammar, lang)}
              padding={16}
              placeholder="Yahan apna code paste karo…"
              style={{ fontFamily: '"Fira Code","Fira Mono",Consolas,monospace', fontSize: 14, minHeight: "100%", color: "#f8f8f2" }}
            />
          </div>
          <div className="panel-foot">
            <span className="stats">{lines} lines · {code.length} chars · <kbd>Ctrl</kbd>+<kbd>Enter</kbd></span>
            <button className="review" onClick={reviewCode} disabled={loading || !code.trim()}>
              {loading && <span className="spinner" />}{loading ? "Reviewing…" : "Review Code"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div className="panel-title">AI Review <small>output</small></div>
            <div className="actions">
              <button className="btn" onClick={copyReview} disabled={!review}>{copied ? "Copied ✓" : "Copy"}</button>
            </div>
          </div>
          <div className="result">
            {loading ? (
              <div className="skeleton">
                <div style={{ width: "40%" }} /><div /><div style={{ width: "85%" }} /><div style={{ width: "70%" }} /><div style={{ width: "92%" }} />
              </div>
            ) : error ? (
              <div className="error-card">
                <strong>⚠️ Review nahi mil paya</strong>
                <span>{error}</span>
                <button className="btn" onClick={reviewCode}>Try again</button>
              </div>
            ) : review ? (
              <div className="markdown">
                <Markdown rehypePlugins={[rehypeHighlight]}>{review}</Markdown>
              </div>
            ) : (
              <div className="empty">
                <div className="icon">🔍</div>
                <h3>Review ka wait hai</h3>
                <ul>
                  <li>🐞 Bugs aur logic errors</li>
                  <li>🔒 Security risks</li>
                  <li>⚡ Performance aur best practices</li>
                </ul>
                <span>Code paste karo aur <b>Review Code</b> dabao</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {showHistory && (
        <>
          <div className="overlay" onClick={() => setShowHistory(false)} />
          <aside className="drawer">
            <div className="panel-head">
              <div className="panel-title">Review History <small>{history.length} saved</small></div>
              <div className="actions">
                <button className="btn" onClick={() => setHistory([])} disabled={!history.length}>Clear all</button>
                <button className="btn" onClick={() => setShowHistory(false)}>✕</button>
              </div>
            </div>
            <div className="drawer-list">
              {history.length === 0 && <div className="empty">Abhi koi review save nahi hai.</div>}
              {history.map((h) => (
                <div key={h.id} className="h-item" onClick={() => openHistory(h)}>
                  <div className="h-top">
                    <span>{LANGUAGES[h.lang]?.label || h.lang} · {h.time}</span>
                    <button className="x" aria-label="Delete"
                      onClick={(e) => { e.stopPropagation(); setHistory((p) => p.filter((x) => x.id !== h.id)); }}>🗑</button>
                  </div>
                  <div className="h-code">{h.code.trim().split("\n")[0] || "(empty)"}</div>
                </div>
              ))}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

export default App
