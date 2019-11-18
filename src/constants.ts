import { IndexableObject } from "./types/IndexableObject";

export const templates: IndexableObject = {
  Class: "class",
  Interface: "interface",
  Controller: "controller",
  Enum: "enum"
};

export const fileNameRegex: RegExp = /^[a-zA-Z0-9_]+$/;
