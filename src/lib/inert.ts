// React 18 не знает атрибут inert в типах; ставим его строкой.
export const inert = (on: boolean): Record<string, string> => (on ? { inert: "" } : {});
