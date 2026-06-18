import { useEffect, useState } from "react";
import Landing from "./Landing";
import Projects from "./Projects";
import Workspace from "./components/Workspace";

type View = "landing" | "projects" | "workspace";
type Theme = "light" | "dark";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [theme, setTheme] = useState<Theme>("light");
  const [project, setProject] = useState<{
    id: string;
    name: string;
    context: string;
  }>({
    id: "untitled",
    name: "Untitled project",
    context: "",
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  if (view === "landing") {
    return (
      <Landing
        onEnter={() => setView("projects")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (view === "projects") {
    return (
      <Projects
        onOpen={(p) => {
          setProject(p);
          setView("workspace");
        }}
        onLogout={() => setView("landing")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <Workspace
      key={project.id}
      projectKey={project.id}
      projectName={project.name}
      projectContext={project.context}
      onBack={() => setView("projects")}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
}
