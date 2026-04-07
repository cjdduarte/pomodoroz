import type { PayloadAction } from "@reduxjs/toolkit";

export type ListPayload<T extends keyof TaskList> = PayloadAction<
  TaskList[T]
>;
export type TaskPayload<T extends keyof Task> = PayloadAction<Task[T]>;

export type Task = {
  _id: string;
  text: string;
  description: string;
  done: boolean;
  dayColor?: DayColor;
  dayColorDate?: string | null;
};

export type DayColor = "green" | "red" | null;

export type TaskList = {
  _id: string;
  title: string;
  cards: Task[];
  priority: boolean;
  dayColor: DayColor;
  dayColorDate: string | null;
};
