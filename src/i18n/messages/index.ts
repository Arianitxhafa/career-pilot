import { app } from "./app";
import { auth } from "./auth";
import { board } from "./board";
import { copilot } from "./copilot";
import { insights } from "./insights";
import { landing } from "./landing";

// Each namespace keeps English and Albanian side by side; `sq` is typed as `typeof en`,
// so a missing or misspelled key fails the type check.
export const dictionaries = {
  en: { ...app.en, ...board.en, ...copilot.en, ...insights.en, auth: auth.en, landing: landing.en },
  sq: { ...app.sq, ...board.sq, ...copilot.sq, ...insights.sq, auth: auth.sq, landing: landing.sq },
};

export type Dict = (typeof dictionaries)["en"];
