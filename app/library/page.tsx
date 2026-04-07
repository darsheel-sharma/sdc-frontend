"use client";

import { FormEvent, useMemo, useState } from "react";
import Navbar from "@/app/components/navbar";

type Project = {
  id: string;
  title: string;
  description: string;
};

const initialProjects: Project[] = [
  {
    id: "p1",
    title: "NovaFeed Social Experience",
    description:
      "Built a LinkedIn-style home feed with composer, interactions, and responsive card layouts.",
  },
  {
    id: "p2",
    title: "Developer Auth Bypass",
    description:
      "Added localhost-only auth bypass in development while preserving strict auth in production.",
  },
];

export default function AccountPage() {
  const [name, setName] = useState("Your Name");
  const [bio, setBio] = useState(
    "Frontend developer focused on product-minded experiences and clean UI engineering.",
  );

  const [skills, setSkills] = useState<string[]>([
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind",
  ]);
  const [skillInput, setSkillInput] = useState("");

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const initials = useMemo(() => {
    const parts = name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase());

    return parts.length > 0 ? parts.join("") : "U";
  }, [name]);

  const addSkill = () => {
    const normalized = skillInput.trim();

    if (!normalized) return;
    if (skills.some((skill) => skill.toLowerCase() === normalized.toLowerCase())) {
      setSkillInput("");
      return;
    }

    setSkills((prev) => [...prev, normalized]);
    setSkillInput("");
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill !== skillToRemove));
  };

  const addProject = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedTitle = projectTitle.trim();
    const trimmedDescription = projectDescription.trim();

    if (!trimmedTitle || !trimmedDescription) return;

    const newProject: Project = {
      id: `p-${Date.now()}`,
      title: trimmedTitle,
      description: trimmedDescription,
    };

    setProjects((prev) => [newProject, ...prev]);
    setProjectTitle("");
    setProjectDescription("");
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#F2F0EF] text-[#1c1b20]">
      <Navbar />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1c1b20] text-xl font-bold text-white">
              {initials}
            </div>

            <div className="w-full space-y-4">
              <h1 className="text-2xl font-bold">My Account</h1>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-[#1c1b20]/85">
                  Name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 font-normal outline-none focus:border-[#1c1b20]/40"
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-[#1c1b20]/85">
                Bio
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="mt-1 w-full resize-none rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 font-normal outline-none focus:border-[#1c1b20]/40"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Skills</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-2 rounded-full border border-[#1c1b20]/15 bg-[#f5f2ef] px-3 py-1 text-sm font-semibold"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded px-1 text-[#1c1b20]/60 hover:bg-[#e9e5e2]"
                  aria-label={`Remove ${skill}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add a skill"
              className="w-full rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg bg-[#1c1b20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
            >
              Add
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#1c1b20]/10 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Projects</h2>

          <form onSubmit={addProject} className="mt-4 grid gap-3">
            <input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Project title"
              className="w-full rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
            />
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Project description"
              rows={3}
              className="w-full resize-none rounded-lg border border-[#1c1b20]/20 bg-white px-3 py-2 text-sm outline-none focus:border-[#1c1b20]/40"
            />
            <button
              type="submit"
              className="w-fit rounded-lg bg-[#1c1b20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2b2a32]"
            >
              Add Project
            </button>
          </form>

          <div className="mt-5 space-y-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-[#1c1b20]/10 bg-[#fcfbfa] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#1c1b20]">{project.title}</h3>
                    <p className="mt-1 text-sm text-[#1c1b20]/75">{project.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteProject(project.id)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-[#8c2b2b] hover:bg-[#f8ecec]"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
