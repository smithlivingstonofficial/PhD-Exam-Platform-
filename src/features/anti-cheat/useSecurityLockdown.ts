"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { recordCandidateViolationAction } from "@/features/exam-session/actions";

interface UseSecurityLockdownProps {
  sessionId: string;
  maxStrikes?: number;
  enabled?: boolean;
  onStrike: (strikeNumber: number, reason: string, isDisqualified: boolean) => void;
  onDevToolsDetected?: () => void;
}

export function useSecurityLockdown({
  sessionId,
  maxStrikes = 3,
  enabled = true,
  onStrike,
  onDevToolsDetected,
}: UseSecurityLockdownProps) {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    typeof document !== "undefined" ? Boolean(document.fullscreenElement) : false
  );
  const [strikeCount, setStrikeCount] = useState<number>(0);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const isDisqualifiedRef = useRef<boolean>(false);

  // Debounce multiple rapid-fire events
  const lastIncidentTimeRef = useRef<number>(0);

  const registerViolation = useCallback(
    async (eventType: string, reason: string) => {
      if (!enabled || isDisqualifiedRef.current) return;

      const now = Date.now();
      // Debounce window within 1.5s
      if (now - lastIncidentTimeRef.current < 1500) return;
      lastIncidentTimeRef.current = now;

      setStrikeCount((prev) => {
        const nextStrike = prev + 1;
        const disqualified = nextStrike >= maxStrikes;
        if (disqualified) {
          isDisqualifiedRef.current = true;
          setIsDisqualified(true);
        }

        // Call client callback
        onStrike(nextStrike, reason, disqualified);

        // Async log to Supabase audit trail
        recordCandidateViolationAction({
          sessionId,
          eventType,
          severity: isDisqualified ? "CRITICAL" : "HIGH",
          details: {
            reason,
            strikeNumber: nextStrike,
            maxStrikes,
            timestamp: new Date().toISOString(),
          },
        }).catch((err) => console.error("Violation logging error:", err));

        return nextStrike;
      });
    },
    [enabled, isDisqualified, maxStrikes, onStrike, sessionId]
  );

  // 1. Fullscreen Change Handler (Zero Strikes, Silent Informational Audit Only)
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const inFull = Boolean(
        document.fullscreenElement ||
          (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      setIsFullscreen(inFull);

      // Fullscreen exit does NOT count as a strike - instead, FullscreenGuardModal
      // blurs the entire viewport and prompts candidate to return.
      if (!inFull && !isDisqualifiedRef.current) {
        recordCandidateViolationAction({
          sessionId,
          eventType: "FULLSCREEN_EXIT_PROMPT",
          severity: "LOW",
          details: {
            reason: "Candidate exited fullscreen. Exam screen blurred until re-entered.",
            timestamp: new Date().toISOString(),
          },
        }).catch((err) => console.error("Fullscreen exit audit logging error:", err));
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [enabled, sessionId]);

  // 2. Tab-Switch / Page Visibility Handler
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !isDisqualifiedRef.current) {
        registerViolation(
          "TAB_SWITCH_DETECTED",
          "Candidate switched browser tabs or minimized the examination window."
        );
      }
    };

    const handleWindowBlur = () => {
      // Only fire window blur if currently in fullscreen to prevent duplicate strikes when guard modal is active
      if (!isDisqualifiedRef.current && isFullscreen) {
        registerViolation(
          "WINDOW_BLUR_DETECTED",
          "Candidate navigated away from the active examination window."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, isFullscreen, registerViolation]);

  // 3. Peripheral Lockdown: Disable Keyboard DevTools Shortcuts, Clipboard, Drag & Drop & PrintScreen
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        registerViolation("DEVTOOLS_SHORTCUT_F12", "F12 key pressed.");
        return;
      }

      // PrintScreen Key - Clear clipboard and prevent screenshot scraping
      if (e.key === "PrintScreen") {
        e.preventDefault();
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText("");
          }
        } catch {
          // Clipboard write may fail if document focus is lost; safe to ignore
        }
        return;
      }

      // DevTools Inspection: Windows (Ctrl+Shift+I/J/C) & macOS (Cmd+Alt+I/J/C or Cmd+Shift+I/J/C)
      const isDevToolsInspect =
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(e.key.toUpperCase()));

      if (isDevToolsInspect) {
        e.preventDefault();
        registerViolation("DEVTOOLS_SHORTCUT_INSPECT", "DevTools shortcut pressed.");
        return;
      }

      // Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === "U") {
        e.preventDefault();
        registerViolation("SOURCE_VIEW_SHORTCUT", "View page source shortcut Ctrl+U pressed.");
        return;
      }

      // Ctrl+S (Save page) or Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && ["S", "P"].includes(e.key.toUpperCase())) {
        e.preventDefault();
        return;
      }

      // Ctrl+C, Ctrl+X, Ctrl+V, Ctrl+A (Clipboard & Selection)
      if ((e.ctrlKey || e.metaKey) && ["C", "X", "V", "A"].includes(e.key.toUpperCase())) {
        // Prevent copying question text
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("contextmenu", handleContextMenu, { capture: true });
    window.addEventListener("copy", handleCopy, { capture: true });
    window.addEventListener("cut", handleCut, { capture: true });
    window.addEventListener("paste", handlePaste, { capture: true });
    window.addEventListener("dragstart", handleDragStart, { capture: true });
    window.addEventListener("drop", handleDrop, { capture: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("contextmenu", handleContextMenu, { capture: true });
      window.removeEventListener("copy", handleCopy, { capture: true });
      window.removeEventListener("cut", handleCut, { capture: true });
      window.removeEventListener("paste", handlePaste, { capture: true });
      window.removeEventListener("dragstart", handleDragStart, { capture: true });
      window.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, [enabled, registerViolation]);

  // 4. DevTools Geometry Detection Trap
  useEffect(() => {
    if (!enabled) return;

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if ((widthThreshold || heightThreshold) && !isDisqualifiedRef.current) {
        if (onDevToolsDetected) onDevToolsDetected();
        registerViolation(
          "DEVTOOLS_WINDOW_INSPECTION",
          "Browser developer tools panel detected open alongside exam."
        );
      }
    };

    const interval = setInterval(checkDevTools, 2000);
    return () => clearInterval(interval);
  }, [enabled, onDevToolsDetected, registerViolation]);

  // Request Fullscreen helper
  const requestFullscreen = async () => {
    try {
      const docEl = document.documentElement as unknown as {
        requestFullscreen?: () => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if (docEl.webkitRequestFullscreen) {
        await docEl.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn("Fullscreen request error:", err);
    }
  };

  return {
    isFullscreen,
    strikeCount,
    maxStrikes,
    isDisqualified,
    requestFullscreen,
  };
}
