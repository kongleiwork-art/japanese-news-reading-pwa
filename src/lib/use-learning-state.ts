"use client";

import { useSyncExternalStore } from "react";

import {
  createEmptyLearningState,
  readLearningState,
  STORAGE_KEY,
  subscribeLearningState,
  type LearningState,
} from "@/lib/learning-store";

const serverSnapshot = createEmptyLearningState();
let lastRawSnapshot: string | null | undefined;
let lastParsedSnapshot: LearningState = serverSnapshot;

export function useLearningState() {
  return useSyncExternalStore(
    subscribeLearningState,
    getClientSnapshot,
    getServerSnapshot,
  );
}

function getClientSnapshot() {
  if (typeof window === "undefined") {
    return serverSnapshot;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw === lastRawSnapshot) {
    return lastParsedSnapshot;
  }

  lastRawSnapshot = raw;
  lastParsedSnapshot = readLearningState();
  return lastParsedSnapshot;
}

function getServerSnapshot() {
  return serverSnapshot;
}
