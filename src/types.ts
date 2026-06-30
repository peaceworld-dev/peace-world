export type RoomId = "hall" | "living" | "bedroom" | "garden" | "temple";

export type AmbientSound = "silence" | "rain" | "waves" | "wind" | "night" | "forest" | "fire" | "stream" | "binaural";

export interface Room {
  id: RoomId;
  name: string;
  subtitle: string;
  description: string;
  ambientSound: AmbientSound;
  baseInstruction: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface JournalNote {
  id: string;
  content: string;
  mood: string;
  createdAt: string;
}
