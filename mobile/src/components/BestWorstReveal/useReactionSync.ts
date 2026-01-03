import { useEffect, useRef } from 'react';
import { getDatabase, ref, onChildAdded, off } from 'firebase/database';
import { EmojiReaction } from '../../types/game';

/**
 * Hook to listen for real-time emoji reactions from Firebase.
 * Calls the callback function whenever a new reaction is added.
 * Ignores reactions that existed before this component mounted.
 */
export function useReactionSync(
  gameCode: string,
  roundNumber: number,
  onReactionReceived: (reaction: EmojiReaction) => void
) {
  const mountTime = useRef(Date.now());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const db = getDatabase();
    const reactionsRef = ref(db, `games/${gameCode}/roundResults/round_${roundNumber}/reactions`);

    // Listen for new reactions
    const handleChildAdded = (snapshot: any) => {
      const reaction = snapshot.val() as EmojiReaction;

      // Skip reactions from before we mounted (prevents replaying old reactions)
      if (reaction && reaction.timestamp >= mountTime.current) {
        onReactionReceived(reaction);
      } else if (isInitialLoad.current) {
        // Ignore initial batch of old reactions
        return;
      }
    };

    const unsubscribe = onChildAdded(reactionsRef, handleChildAdded);

    // After a brief moment, mark initial load as complete
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 500);

    // Cleanup listener on unmount
    return () => {
      clearTimeout(timer);
      off(reactionsRef, 'child_added', unsubscribe);
    };
  }, [gameCode, roundNumber, onReactionReceived]);
}
