import { useEffect, useRef } from 'react';
import { TaskTimeBlock } from '../types/task';
import { getISODateString } from '../utils/date';
import {
  notifyTimeBlockStart,
  notifyHourReviewPrompt
} from '../utils/notifications';

interface UseTimeBlockSchedulerOptions {
  timeBlocks: TaskTimeBlock[];
  onReviewNeeded?: (block: TaskTimeBlock) => void;
  onFallbackNotice?: (message: string) => void;
}

export function useTimeBlockScheduler({
  timeBlocks,
  onReviewNeeded,
  onFallbackNotice
}: UseTimeBlockSchedulerOptions): void {
  const notifiedStartsRef = useRef<Set<string>>(new Set());
  const notifiedReviewsRef = useRef<Set<string>>(new Set());
  const onReviewNeededRef = useRef(onReviewNeeded);
  const onFallbackNoticeRef = useRef(onFallbackNotice);

  useEffect(() => {
    onReviewNeededRef.current = onReviewNeeded;
  }, [onReviewNeeded]);

  useEffect(() => {
    onFallbackNoticeRef.current = onFallbackNotice;
  }, [onFallbackNotice]);

  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = getISODateString(now);

      let reviewTriggeredInThisPass = false;

      timeBlocks.forEach((block) => {
        // Enforce strict date isolation: real-time start and review alerts only apply to TODAY
        if (block.date !== todayStr) {
          return;
        }

        const blockKey = `${block.id}_${block.date}_${block.startHour}_${block.startMinute || 0}`;

        const nowTotalMins = currentHour * 60 + currentMinute;
        const totalStartMins = block.startHour * 60 + (block.startMinute || 0);
        const totalEndMins = totalStartMins + (block.durationMinutes || 60);
        const blockEndHour = Math.floor(totalEndMins / 60) % 24;

        // 1. Check if block is starting now (within first 3 minutes of scheduled start)
        const elapsedSinceStart = nowTotalMins - totalStartMins;
        if (
          elapsedSinceStart >= 0 &&
          elapsedSinceStart <= 3 &&
          !notifiedStartsRef.current.has(blockKey) &&
          block.status === 'planned'
        ) {
          notifiedStartsRef.current.add(blockKey);
          notifyTimeBlockStart(
            block.taskTitle,
            block.durationMinutes,
            onFallbackNoticeRef.current
          );
        }

        // 2. Check if a block JUST completed (within 15-minute transition window after block end)
        const elapsedSinceEnd = nowTotalMins - totalEndMins;
        const isAtTransitionBoundary = elapsedSinceEnd >= 0 && elapsedSinceEnd <= 15;

        if (
          isAtTransitionBoundary &&
          (block.status === 'planned' || block.status === 'active') &&
          !notifiedReviewsRef.current.has(blockKey)
        ) {
          notifiedReviewsRef.current.add(blockKey);
          notifyHourReviewPrompt(
            blockEndHour,
            block.taskTitle,
            onFallbackNoticeRef.current
          );

          // Prompt at most one interactive modal per check to avoid UI modal stacking
          if (!reviewTriggeredInThisPass && onReviewNeededRef.current) {
            reviewTriggeredInThisPass = true;
            onReviewNeededRef.current(block);
          }
        }
      });
    };

    // Run initial check
    checkSchedule();

    // Check every 30 seconds
    const interval = setInterval(checkSchedule, 30000);
    return () => clearInterval(interval);
  }, [timeBlocks]);
}
