import { useTheme } from "@/contexts/ThemeContext";
import ThreeDotSpinner from "@/components/ui/ThreeDotSpinner";
import React, { useEffect, useRef, useState } from "react";

interface LoadingStateProps {
  className?: string;
  fullHeight?: boolean;
  size?: "sm" | "md" | "lg";
}

const FACTS = [
  "Bananas are berries, but strawberries are not.",
  "The Amazon rainforest churns out 20% of our planet’s oxygen.",
  "Some desert glass in Libya crystallized 29 million years ago.",
  "Bioluminescent plankton can make entire waves glow blue.",
  "A single fungal network in Oregon spans over 2,200 acres underground.",
  "Lake Natron’s extreme alkalinity literally mummifies animals.",
  "34% of Bundestag seats are held by women.",
  "Only about 10% of large companies have formal diversity councils.",
  "Germany’s unadjusted gender pay gap sits at around 18%.",
  "The employment rate for people with disabilities is roughly 55%.",
  "Nearly 40% of German schoolchildren have a migrant background.",
  "Octopuses wield three hearts and blue blood.",
  "Honeybees can learn and remember human faces.",
  "Tardigrades survive the vacuum and radiation of space.",
  "Male seahorses get pregnant and give birth.",
  "Crows can recall and hold grudges against specific humans.",
  "31% of LGBTQ+ Germans face hate-motivated insults.",
  "Women earn just €0.78 for every €1 earned by men in Germany.",
  "Germany: 41% of Muslims report daily discrimination.",
  "Germany: Unemployment among people with disabilities is nearly double the national rate.",
  "Germany: Migrants earn on average about 20% less than native-born workers.",
  "The Eiffel Tower can be 15 cm taller during hot days.",
  "There are more stars in the universe than grains of sand on Earth.",
  "Hot water freezes faster than cold water under certain conditions.",
  "Sloths can hold their breath longer than dolphins can.",
  "Sea otters hold hands while sleeping so they don’t drift apart."
];

export const LoadingState = ({ 
  className = "",
  fullHeight = false,
  size = "md"
}: LoadingStateProps) => {
  const { language } = useTheme();
  
  const heightClass = fullHeight ? "h-screen" : "h-64";
  
  const message = language === "en" 
    ? "Inclusive puzzle pieces are being assembled..." 
    : "Inklusive Puzzleteile werden zusammengefügt...";
  
  const pxSize = size === "sm" ? 24 : size === "lg" ? 64 : 40;

  // Fact logic
  const [showFact, setShowFact] = useState(false);
  const [factIndex, setFactIndex] = useState<number | null>(null);
  const usedFacts = useRef<number[]>([]);

  useEffect(() => {
    let showFactTimeout: NodeJS.Timeout;
    let factInterval: NodeJS.Timeout;

    // Show first fact after 5 seconds
    showFactTimeout = setTimeout(() => {
      setShowFact(true);
      // Pick a random fact to start
      setFactIndex(Math.floor(Math.random() * FACTS.length));
      // Change fact every 8 seconds
      factInterval = setInterval(() => {
        let nextIndex: number;
        // Avoid immediate repeats until all facts shown
        if (usedFacts.current.length >= FACTS.length) {
          usedFacts.current = [];
        }
        do {
          nextIndex = Math.floor(Math.random() * FACTS.length);
        } while (usedFacts.current.includes(nextIndex) && usedFacts.current.length < FACTS.length);
        usedFacts.current.push(nextIndex);
        setFactIndex(nextIndex);
      }, 8000);
    }, 3000);

    return () => {
      clearTimeout(showFactTimeout);
      clearInterval(factInterval);
    };
  }, []);

  return (
    <div className={`flex flex-col justify-center items-center ${heightClass} ${className}`}>
      <ThreeDotSpinner
        size={`${pxSize}px`}
        color="#3bb1c0"      // <-- Change color here
        speed="1.5s"        // <-- Change rotation speed here (smaller = faster)
      />
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">
        {message}
      </p>
      {showFact && factIndex !== null && (
        <div className="mt-8 max-w-md text-center text-base text-blue-700 bg-blue-50 rounded p-4 shadow animate-fade-in">
          <span className="font-semibold">Content is loading, Did you know?</span>
          <br />
          {FACTS[factIndex]}
        </div>
      )}
    </div>
  );
};