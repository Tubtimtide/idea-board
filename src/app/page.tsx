"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type Idea = {
  id: string;
  title: string;
  description: string;
  author_nickname: string;
  vote_count: number;
};

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function loadIdeas() {
    const { data, error } = await supabase.rpc("list_ideas");
    setLoading(false);
    if (error) {
      setMessage("Unable to load ideas. Check your connection and database setup.");
      return;
    }
    setIdeas(data ?? []);
  }

  useEffect(() => {
    void loadIdeas();
  }, []);

  async function submitIdea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.from("ideas").insert({
        title: title.trim(),
        description: description.trim(),
        author_nickname: nickname.trim(),
      });
      if (error) throw error;
      setTitle("");
      setDescription("");
      setNickname("");
      await loadIdeas();
      setMessage("Idea submitted successfully!");
    } catch {
      setMessage("Unable to submit your idea. Check your connection and database permissions.");
    } finally {
      setBusy(false);
    }
  }

  async function vote(ideaId: string) {
    if (busy) return;
    setBusy(true);
    setMessage("");

    try {
      let voterId = localStorage.getItem("idea-board-voter");
      if (!voterId) {
        voterId = crypto.randomUUID();
        localStorage.setItem("idea-board-voter", voterId);
      }

      const { error } = await supabase.rpc("vote_idea", {
        p_idea_id: ideaId,
        p_voter_id: voterId,
      });

      if (error?.code === "23505") {
        setMessage("You have already voted for this idea.");
        return;
      }
      if (error) throw error;
      await loadIdeas();
      setMessage("Vote recorded!");
    } catch {
      setMessage("Unable to vote. Check your connection and allow browser storage.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <header>
        <span className="tag">A SPACE FOR YOUR NEXT BIG THING</span>
        <h1>Idea Board<span>.</span></h1>
        <p>Share your ideas and vote for what you want to see happen.</p>
      </header>

      <div className="board">
        <section className="panel">
          <h2>Submit an idea</h2>
          <form onSubmit={submitIdea}>
            <label htmlFor="nickname">Nickname</label>
            <input id="nickname" value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40} required pattern=".*\S.*" />

            <label htmlFor="title">Idea title</label>
            <input id="title" value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120} required pattern=".*\S.*" />

            <label htmlFor="description">Description</label>
            <textarea id="description" value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000} rows={5} required />

            <button disabled={busy || !description.trim()}>
              {busy ? "Working…" : "Submit idea"}
            </button>
          </form>
        </section>

        <section aria-labelledby="ideas-heading">
          <h2 id="ideas-heading">Latest ideas <small>({ideas.length})</small></h2>
          {loading && <p>Loading ideas…</p>}
          {!loading && ideas.length === 0 && (
            <div className="panel empty">No ideas to display yet.</div>
          )}
          {ideas.map((idea) => (
            <article className="panel idea" key={idea.id}>
              <div>
                <h3>{idea.title}</h3>
                <p className="description">{idea.description}</p>
                <small>Shared by {idea.author_nickname}</small>
              </div>
              <button className="vote" disabled={busy}
                aria-label={`Vote for ${idea.title} — ${idea.vote_count} votes`}
                onClick={() => vote(idea.id)}>
                ▲<br />{idea.vote_count}
              </button>
            </article>
          ))}
        </section>
      </div>

      <p className="message" role="status">{message}</p>
      <footer>
        One vote per idea per browser identifier.
        Clearing browser data or switching browsers may create a new identifier.
      </footer>
    </main>
  );
}
