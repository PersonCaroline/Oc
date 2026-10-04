export const THEMES = [
  { id: "goth", name: "Goth" },
  { id: "circus", name: "Circus" },
  { id: "forest", name: "Forest" },
  { id: "detective", name: "Detective" },
  { id: "mafia", name: "Mafia" },
  { id: "asylum", name: "Asylum" },
];

export const getTheme = () => {
  try {
    return localStorage.getItem("oc-theme") || "goth";
  } catch {
    return "goth";
  }
};

export const applyTheme = (id) => {
  document.documentElement.dataset.theme = id;
  try {
    localStorage.setItem("oc-theme", id);
  } catch {
    /* ignore */
  }
};