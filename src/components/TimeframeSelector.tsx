import React, { useState, useEffect } from "react";
import { styled } from "@stitches/react";
import { motion } from "framer-motion";
import { differenceInDays, format } from "date-fns";
import { useEarliestPlay } from "@/hooks/queries/useEarliestPlay";
import {
  generateTimeframeOptions,
  TimeframeOption,
  getCurrentTimeframe,
  setCurrentTimeframe,
  formatTimeframeDescription,
} from "../lib/timeframe";

interface TimeframeSelectorProps {
  onTimeframeChange?: (timeframe: TimeframeOption) => void;
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  onTimeframeChange,
}) => {
  const [timeframes] = useState<TimeframeOption[]>(generateTimeframeOptions());
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(
    getCurrentTimeframe(),
  );
  const [isOpen, setIsOpen] = useState(false);
  const { data: earliest } = useEarliestPlay();
  const describe = (t: TimeframeOption) =>
    t.id === "all-time" && earliest ? `Since ${format(earliest, "MMM yyyy")}` : formatTimeframeDescription(t);

  const handleTimeframeSelect = (timeframe: TimeframeOption) => {
    setSelectedTimeframe(timeframe);
    setCurrentTimeframe(timeframe);
    setIsOpen(false);

    if (onTimeframeChange) {
      onTimeframeChange(timeframe);
    }
  };

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".timeframe-selector")) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <SelectorContainer className="timeframe-selector">
      <CurrentSelection
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedTimeframe.name}</span>
        <TimeframeDescription>
          {describe(selectedTimeframe)}
        </TimeframeDescription>
        <DropdownIcon as="span" aria-hidden="true" isOpen={isOpen}>
          ▼
        </DropdownIcon>
      </CurrentSelection>
      {earliest && selectedTimeframe.id !== "all-time" && differenceInDays(earliest, selectedTimeframe.startDate) > 14 && (
        <Hint>History starts {format(earliest, "MMM d, yyyy")}. If that looks too recent, ask the server owner to check the Playback Reporting retention.</Hint>
      )}

      {isOpen && (
        <DropdownMenu
          as={motion.div}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {timeframes.map((timeframe) => (
            <DropdownItem
              key={timeframe.id}
              type="button"
              aria-current={timeframe.id === selectedTimeframe.id ? "true" : undefined}
              isSelected={timeframe.id === selectedTimeframe.id}
              onClick={() => handleTimeframeSelect(timeframe)}
            >
              <span>{timeframe.name}</span>
              <TimeframeDescription>
                {describe(timeframe)}
              </TimeframeDescription>
            </DropdownItem>
          ))}
        </DropdownMenu>
      )}
    </SelectorContainer>
  );
};

const SelectorContainer = styled("div", {
  position: "relative",
  width: "100%",
  maxWidth: "300px",
  margin: "0 auto 20px",
  zIndex: 100,
});

const CurrentSelection = styled("button", {
  display: "flex",
  width: "100%",
  font: "inherit",
  textAlign: "left",
  color: "white",
  flexDirection: "column",
  padding: "10px 15px",
  backgroundColor: "rgba(255, 255, 255, 0.15)",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  position: "relative",

  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },

  span: {
    fontWeight: "bold",
    color: "white",
  },
});

const TimeframeDescription = styled("small", {
  color: "rgba(255, 255, 255, 0.92)",
  fontSize: "0.8rem",
  marginTop: "2px",
});

const Hint = styled("small", {
  display: "block",
  color: "rgba(255, 255, 255, 0.8)",
  fontSize: "0.75rem",
  marginTop: "6px",
  lineHeight: 1.3,
});

const DropdownIcon = styled("div", {
  position: "absolute",
  right: "15px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "white",
  fontSize: "0.8rem",
  transition: "transform 0.2s ease",

  variants: {
    isOpen: {
      true: {
        transform: "translateY(-50%) rotate(180deg)",
      },
    },
  },
});

const DropdownMenu = styled("div", {
  position: "absolute",
  top: "calc(100% + 5px)",
  left: 0,
  right: 0,
  backgroundColor: "rgba(45, 0, 247, 0.95)",
  backdropFilter: "blur(10px)",
  borderRadius: "8px",
  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
  maxHeight: "300px",
  overflowY: "auto",
  border: "1px solid rgba(255, 255, 255, 0.1)",
});

const DropdownItem = styled("button", {
  width: "100%",
  minHeight: "44px",
  border: "none",
  background: "transparent",
  font: "inherit",
  textAlign: "left",
  padding: "10px 15px",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  flexDirection: "column",

  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  span: {
    color: "white",
  },

  variants: {
    isSelected: {
      true: {
        backgroundColor: "rgba(255, 215, 0, 0.2)",

        "&:hover": {
          backgroundColor: "rgba(255, 215, 0, 0.3)",
        },

        span: {
          fontWeight: "bold",
        },
      },
    },
  },
});

export default TimeframeSelector;
