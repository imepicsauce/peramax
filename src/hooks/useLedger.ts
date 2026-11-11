import { useCallback, useRef, useState } from "react";
import { browserRepository, type Repository } from "../lib/storage";
import { emptyState, type AppState } from "../lib/types";
export function useLedger(today: string, repository?: Repository) {
  const [repo] = useState(() => {
    if (repository) return repository;
    try {
      return browserRepository(window.localStorage);
    } catch {
      return {
        load: () => ({
          state: emptyState(),
          warning:
            "Browser storage is unavailable. Changes will last for this session.",
          canPersist: false,
        }),
        save: () => {},
      } satisfies Repository;
    }
  });
  const [initial] = useState(() => repo.load(today));
  const [state, setState] = useState(initial.state),
    [warning, setWarning] = useState(initial.warning);
  const current = useRef(state);
  const update = useCallback(
    (change: (state: AppState) => AppState) => {
      const next = change(current.current);
      current.current = next;
      setState(next);
      if (initial.canPersist)
        try {
          repo.save(next);
          setWarning("");
        } catch {
          setWarning(
            "Could not save to this browser. Your changes are available only in this session.",
          );
        }
    },
    [repo, initial.canPersist],
  );
  return { state, update, warning };
}
