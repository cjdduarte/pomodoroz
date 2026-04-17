import type { PayloadAction } from "@reduxjs/toolkit";

export type TaskSelection = {
  listId: string;
  cardId: string;
};

export type TaskSelectionPayload = PayloadAction<TaskSelection>;
